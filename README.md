# Whisk

A framework for building real-time web systems using Cipher and socket.io.

# Status

This software is actively under development and is not yet ready for release!

Also, it is important to note that pre-1.x Whisk depends on pre-1.x socket.io. An effort is under way to bring Whisk into the much-improved world of post-0.9.x socket.io!

# Contributors

Originally created by Max Seiden.

Currently maintained by Jamie Pitts.

# Installation

First install [redis 2.x](http://redis.io/download), instructions can be found in [vendor/redis/README.md](vendor/redis/README.md).

npm install rapt-whisk-router

# Overview 

Whisk allows a real-time communications system to be created between web clients and any number of server-side processes. The intention for Whisk is to extend a [rapt-cipher](https://github.com/jpitts/rapt-cipher) network to the web. 

Whisk provides a basic server framework for [socket.io 0.9](https://github.com/Automattic/socket.io/tree/0.9.14), facilitates message-passing between clients and servers, and enables sessions to be shared between socket.io nodes and web nodes. While any node-based web framework can be used with Whisk, [express](https://github.com/strongloop/express) support is built-in.

On the server-side, Cipher (running on top of redis) is used to share addressed messages between the web and websocket services. These services can then pass messages onto separate data processing nodes, and vice-versa, all the way back out to the web clients. A microservices-style system for the web thus can be constructed.

On the client-side, Whisk provides a convenient wrapper for socket.io and provides a means to organize application-specific websocket routes.

# Key Concepts

## Whisk System

A Whisk application is best described as a system of inter-connected components. These components may be traditional web controllers, web client javascript, server-side functions that react to incoming or outgoing messages, or even other node.js technologies outside of the domain of Whisk. 

What brings the components together into a system is their individual roles and how they communicate with each other.

## Horizontal Scaling and Microservices

Whisk enables the developer to take full advantage of the CPU-intensive nature of node.js. This can be accomplished by expanding the number of web and websocket services horizontally onto additional server cores (as opposed to increasing the memory capacity of the server hardware). 

With the use of a proxy, the developer can also decouple and specialize parts of a Whisk system (known as microservices architecture). This further eases scaling as the underlying hardware choices can reflect the expected utilization of specialized components.

## The Separation of Web and WebSocket Services

As web and websockets represent very different kinds of resource utilization, they are run separately. Each has its own means of storing sessions and user data, yet it is critical that the same user is securely known to both. Therefore, a process called session confirmation is performed each time a client connects to the Whisk system so that an individual web client is connected to an individual websocket conenction.

## Message Routing

Whisk enables messages to be routed to nodes throughout the system, to individual clients, or to groups of connected clients. This is accomplished with Whisk's use of [rapt-cipher](https://github.com/jpitts/rapt-cipher) and redis [pub/sub](http://redis.io/topics/pubsub).

Any part of the Whisk system can be messaged, allowing the developer to create functionality that reacts to events.

## Whisk Routes and Observers

Whisk's websocket service can be used to react to events received from end-users, or react to events being sent out to end-users.  These can be used together to create a real-time experience for users. For example, if a user clicks a button in the web UI, details of the event can be received by a Whisk route, the event modified with additional data, and then data sent back out to all other users via a Whisk observer.

Whisk reacts to user-related messages using "route" and "observer" files, the nature of which are detailed later in this README.

# Documentation

## Whisk


### Whisk.init

During Whisk initialization, Cipher message routing and redis are configured, the application context is defined, and key internal variables are defined.

Whisk.init is called with the following attributes:

* `context` - object containing a logger object, a log function, and other implementation-defined attributes
* `port` - which port the Whisk instance will listen on
* `base_path` - indicates to Whisk where the web or websocket files are located
* `cipher` - object containing namespace and nid, used to make Whisk reachable by Cipher
* `redis` - object containing redis configuration
* `session` - object containing shared session configuration

Once initialized, either a web or websocket service can then be run.

Example:

```js
var Whisk = require('rapt-whisk-router')
  , Winston = require('winston')
;

// custom logging with winston
var myLogger = new (Winston.Logger) ({ });
myLogger.add(Winston.transports.Console);
var myLoggerFunction = function log (level, message, attr) {
  if (!attr) { attr={} };
  myLogger.log(level, message, attr);
}

// initialize whisk
Whisk.init({
  context: {
    logger: myLogger,
    log: myLogFunction,
  },
  port: 8888,
  base_path: __dirname,
  cipher: {
    namespace: 'web',
    nid: 0,
  },
  redis: {
    port: 6379,
    options: {}
  },
  session: {
    secret: 'abc123',
    key: 'my-app-name' 
  }
});
```

### Whisk.context

Context is passed onto Whisk during initialization. While context optionally includes logger and the custom log function, you are free to add other attributes in order to make them available via the Whisk.context. 

For example, if you want to provide convenient access your custom data model, just add Model to the context object on init, and later call Whisk.context.Model from anywhere within the Whisk system.

### Whisk.run_websocket_service

Whisk.run_websocket_service is called with the following optional attributes:

* `websocket_routes_path` - defaults to "routes", directory for files containing incoming message handlers
* `websocket_observers_path` - defaults to "observers", directory for files containing outgoing message handlers
* `on_connection` - function containing actions to take after a client has connected.
    IMPORTANT NOTE: this should be handled by Whisk, or use carefully!
* `on_disconnect` - function containing actions to take after a client has disconnected.
* `confirm_ws_session_sync_success` - function containing actions to take after a client has connected and the web and websocket sessions have been confirmed.
* `confirm_ws_session_sync_failure` - called if the session confirmation process has failed
* `confirm_ws_session_sync_error` - called if the session confirmation process has generated an error

A callback allows logging and other actions to take place after starting the websocket service.

Example: 

```js

Whisk.run_websocket_service({
  websocket_routes_path: 'ws_routes',
  websocket_observers_path: 'ws_observers',
  confirm_ws_session_sync_success: function (err, attr) {
    console.log('User ID ' + attr.session_sync_data.user_id + ' confirmed!');
  },
  confirm_ws_session_sync_failure: function (err, attr) {
    console.log('Token ' + attr.token + ' confirmation failed!');  
  },
  confirm_ws_session_sync_error: function (err, attr) {
    console.error('Session sync error: ' + err);
  },
});

```

The handler functions defined in the route and observer files are loaded when Whisk.run_websocket_service is called. Route and observer functions must be defined as part of the websocket service in order to create a system that reacts to incoming and outgoing messages.

Route Example:

This example route file, when saved as "routes/RoomRoute.js", can define a set of functions that are called when a websocket client emits "room.say" or "room.holler". 

```js
var Whisk = require("rapt-whisk-router");
var whisk_handle = Whisk.Router.define_route("world");

whisk_handle.on('say', function (socket, session, payload) {
  console.log('User ID=' + socket.store.user_id + ' says ' + payload.message);,
});

whisk_handle.on('holler', function (socket, session, payload) {
  console.log('User ID=' + socket.store.user_id + ' hollers ' + payload.message);,
});
```

Observer Example:

This observer file, when saved as "observer/RoomObserver.js", can define a set of functions that are called when another part of your Whisk implementation sends a Cipher broadcast to "room.holler" or a Cipher transmit to "room.reply". Any part of your system having a Cipher connection -- the web service, route functions in the websocket service, or even custom node.js processes -- can send messages out through Whisk websockets.

```js
var Whisk = require("rapt-whisk-router");
var Cipher = Whisk.Cipher.getInstance();

// broadcasts a received holler to all clients
Cipher.onBroadcast("room.holler", function(origin, socket, payload) {
  sio.sockets.in().emit("room.holler", payload);
});

// transmits a received reply to one client
Cipher.onTransmit("room.reply", function(origin, socket, payload) {
  if (socket) {
    console.log('Reply to User ID=' + socket.store.user_id + ' ' + payload.message);
    socket.emit("room.reply", payload);
  }
});

```

Observer functions take advantage of [rapt-cipher](https://github.com/jpitts/rapt-cipher), which defines an addressing scheme that allows individual websocket clients or all connected clients to be messaged.

Example broadcast to all clients via the "room.holler" observer:

```js
Cipher.broadcast(
  "room.holler", 
  {message: 'Holler back!'}, 
  {ns: "ws"}
);
```

Example transmit to a specific client via the "room.reply" observer:

```js
Cipher.transmit(
  "room.reply", 
  {message: 'This is my reply.'}, 
  { ns:"ws", nid:0, tid:socket_id}
  socket_id
);
```

How these messages might be handled in the client (by socket.io) is defined later in this README.

A highly sophisticated, reactive application can be built by combining the Whisk incoming and outgoing handlers, client-side socket.io emits and handlers, and server-side Cipher transmits and broadcasts.

### Whisk.run_web_service

Whisk.run_websocket_service is called with the following optional attributes:

* `on_express_init` - called after express has initialized, allowing additional configurations and routes to be defined.

Example:

```js
Whisk.run_web_service({
  on_express_init:  function (app, whisk) {

    // static javascript file
    app.use(express.static(__dirname + '/public'));
    
    // index route
    app.get('/', function(req, res) {
        
      // start the session confirmation process
      whisk.Auth.start_ws_session_sync({
        sid: whisk.Auth.get_sid_from_web_req_cookies(req.cookies),
        user_id: '123456890'
      }, function(ws_token, err) {

        // render the template with the user    
        res.send('<html>... client-side handling of user_id, plus a call to Whisk.WebSocket.init with the ws_token...</html>');

      });

    });
});
```

Due to the requirement to synchronize web and websockets sessions, it is necessary to run the web aspect of your system under Whisk's run_web_service, with a call to Whisk.Auth.start_ws_session_sync on all express routes loading a Whisk client. 

Client-side Javascript:

The Whisk client library is served from the web server URI /rapt-whisk-router/WebSocket.js and contains functionality for socket.io connecting, confirming of Whisk sessions, and enabling the developer to define socket.io handlers of different types.

The client library is initialized with the following attributes:

* `config`
    + `websocket` - with host and port
* `ws_token` - provided by Whisk.Auth.start_ws_session_sync
* `routes` - named functions and handlers allowing for the processing of incoming messages to the client
    + `base` - socket.io handlers (handled by Whisk)
    + `whisk` - includes whisk.auth.request, whisk.auth.error, whisk.auth.accept
    + `app` - message handling for your implementation goes here

Example Client (code running in the HTML client):

```js
Whisk.WebSocket.init({
  config: { websocket: { port: 8889 } },
  ws_token: 1122334455,
  routes: {
    base: {},
    whisk: {},
    app: {
      'world.message': {
        'handler': function (payload) {
          console.log('Received a message: ' + payload.message);
        }
      },
    },
  }
}, function () {
  console.log('Whisk is connected!');
});


```

## Whisk.Config

Whisk.Config is used to maintain handles on instances of external modules.  Whisk internally initializes Whisk.Config during its init call.

### Whisk.Config.cipher_instance

Returns Whisk's cipher connection.

### Whisk.Config.redis_instance

Returns Whisk's redis connection.

### Whisk.Config.io_instance

Returns Whisk's socket.io instance (only available in websocket mode).

### Whisk.Config.express_instance

Returns Whisk's express instance (only available in web mode).

## Whisk.Auth

### Whisk.Auth.get_cipher_address_from_ws

Provided a websocket connection, this function returns the Cipher address (allowing messages to be transmitted to just that client).

Example:

```js
var cipher_addr = Whisk.Auth.get_cipher_address_from_ws({socket: socket});

console.log('cipher namespace: ' + cipher_addr.ns + ', node id: ' + cipher_addr.nid + ', tenent id: ' + cipher_addr.tid);

Whisk.Config.cipher_instance().transmit(
  "some.observer.handler", 
  {message: 'Hello'}, 
  cipher_addr, 
  cipher_addr.tid
);
```

### Whisk.Auth.get_sid_from_web_req_cookies

Returns the web session id given express web request cookies. Whisk internally maintains how the cookie is named. 

Example:

```js
var sid = Whisk.Auth.get_sid_from_web_req_cookies(req.cookies);
```

### Whisk.Auth.start_ws_session_sync

Called only from within the web service, this function starts the session sync process. It returns the ws_token that is then used when initializing the Whisk javascript client in order to confirm the session on the websockets-side.

Example:

```js
Whisk.Auth.start_ws_session_sync({
  sid: whisk.Auth.get_sid_from_web_req_cookies(req.cookies),
  user_id: '1234567890'
}, function(ws_token, err) {
   ... now the web client must call Whisk.WebSocket.init with the ws_token ...
});
```

### Whisk.Auth.confirm_ws_session_sync

Called only from within the websocket service, this function completes the session sync process. It is not necessary to call this function but it is described here in order to illustrate how the confirmation process is completed.

```js
socket.emit("whisk.auth.request", {}, function(payload) {
  Whisk.Auth.confirm_ws_session_sync({
    token: payload.ws_token,
    socket: socket,
    success: confirm_ws_session_sync_success_fn,
    failure: confirm_ws_session_sync_failure_fn,
    error: confirm_ws_session_sync_error_fn,
  });
});
```

NOTE: the "whisk.auth.request" client-side socket.io listener that receives this emit is defined in the Whisk client library.

# Example Implementation, Step-By-Step

The "Hello World" example detailed in [docs/EXAMPLE_SYSTEM.md](docs/EXAMPLE_SYSTEM.md) demonstrates the construction of a Whisk application step-by-step. Once defined, "Hello World" runs on one web server and three websocket servers. This is a web application in which messages are shared among connected users using the following basic features:

* Home page in which a user is retrieved or created
* Random websocket node is pre-selected
* UI indicates which websocket server has been connected to
* Message can be added and sent to the websocket server by clicking "Say Something"
* Message received by the websocket server is modified and routed out to all connected clients
* Session reset page


The [hello-world](examples/hello-world) example implementation files have also been saved among the examples for your convenience.

# Other Example Implementations

The [so-basic](examples/so-basic) example more comprehensively demonstrates a web-based realtime chat system. It is structured differently than "Hello World", and includes a worker node.js process. The following components serve so-basic as separate processes:
- Whisk/express web server
- Whisk/socket.io websocket server
- worker server

The [chat-room](examples/chat-room) example demonstrates a web-based realtime chat system that includes multiple rooms/locations. It also demonstrates the use of a proxy server with Whisk. The following microservices are used to serve chat-room:
- proxy server
- 2 Whisk/express web servers
- 2 Whisk/socket.io websocket servers
- worker server

Lastly, the [chit-chat](https://github.com/jpitts/rapt-cipher/tree/master/examples/chit-chat) example hosted with Cipher demonstrates a bare-bones messaging between two web servers.

