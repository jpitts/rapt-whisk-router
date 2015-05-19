# Example Implementation, Step-By-Step

A minimal Whisk system requires the implementation of a web service, some web client markup and code, and a websocket service. Redis must also be running, which is what Cipher uses to connect web and websockets services. The web and websocket services are fired up separately.

The "Hello World" example outlined below demonstrates a Whisk application running on one web server and three websocket servers. This is a web application in which messages are shared among connected users using the following basic features:

* Home page in which a user is retrieved or created
* Random websocket node is pre-selected
* UI indicates which websocket server has been connected to
* Message can be added and sent to the websocket server by clicking "Say Something"
* Message received by the websocket server is modified and routed out to all connected clients
* Session reset page

## File Structure

```
config.js

web_server.js
public/js/HelloWorldClient.js

websocket_server.js
routes/WorldRoute.js
observers/WorldObserver.js
```

## Service Configuration

In a file named "config.js", the following basic configuration is defined:

```js
var Config = module.exports = exports;

Config.websocket = {
  ports: [8889,8890,8891]
};

Config.web = {
  port: 8888
}

Config.redis = {
  port: 6379
}
```

According to this configuration, the Hello World service will be accessed with a web browser at http://localhost:8888. However, websockets will be accessed by the client with one of the following: http://localhost:8889, http://localhost:8890, and http://localhost:8891. This is a simplistic approach; production deployments would make use of a proxy in order to mask the ports from the user, serving everything from port 80.

## Defining Context and Initializing

Whisk allows you to optionally define an application context, and within that, how to log events in your system. Other useful attributes may be defined in context such as the data model.

```js

var Winston = require('winston');

var logger = new (Winston.Logger) ({ });
logger.add(Winston.transports.Console);

var context = {
  logger: logger,
  log: function (level, message, attr) {
    logger.log(level, message, attr || { some_attr: 'some value' });
  }
}
```

Initialization for web and websocket servers are defined in the same way. Here the application context is passed onto Whisk, as well as which port to use for the service. Cipher must be configured with namespace and node id, usually matching the service name and and an incrementing integer, allowing for more than one server of a type to be running at once. The Redis port can also be defined (used for both Cipher and for session storage).

```js
var Config = require('./config');
var Whisk = require('rapt-whisk-router');

// web service initialization
Whisk.init({
  context: context,
  port: Config.web.port,
  cipher: {  namespace:'web', nid:0 },
  redis: { port: Config.redis.port },
});

```

## Web Service

In a file named "web_service.js", the config, context, and Whisk initialization code is added. Once these are loaded, the web service is started, allowing for express routes and other configurations to be defined. Whisk handles session store and cookie configuration.

```js

Whisk.run_web_service({
  base_path: __dirname,
  on_express_init:  function (app, whisk) {

    // static configuration
    ...
    
    // html view function
    ...
    
    // index route
    ...
    
    // reset route
    ...
    
  }
});
```

Once the html view has been rendered and served to the user's browser, the Hello World javascript client and its dependencies will initialize.

### Static Configuration

A directory for css, js, images and other static resources is defined using express.static. This example only defines a public/js/HelloWorldClient.js, the other client resources are served by Whisk or hosted at Google.

```js
app.use(express.static(__dirname + '/public'));
```

### HTML View

Developers familiar with express will use jade, ejs, or other view framework to dynamically serve HTML. For clarity purposes, a commented view function is defined below. It will later be called from within in the index route.

```js
render_html = function (attr) {
  // attrs:  user_id, ws_token, ws_port, ws_nid
  
  // array of html lines to be joined later
  var html = [];

  html.push("<html>");
  html.push("<head>");

  // socket.io client
  html.push('<script src="http://localhost:" + attr.ws_port + "/socket.io/socket.io.js"></script>');

  // jquery client
  html.push('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>');

  // whisk client (served by Whisk)
  html.push('<script src="/rapt-whisk-router/WebSocket.js"></script>');

  // hello world client (outlined later in this README)
  html.push('<script src="/js/HelloWorldClient.js"></script>');

  html.push("</head>");
  html.push("<body>");

  // some styling
  html.push('<style>div { padding:3px; }</style>');

  // initialize the hello world client
  html.push("<script>");
  html.push('HelloWorldClient.init({ user_id:' + attr.user_id + ', ws_token:' + attr.ws_token + ', ws_port:' + attr.ws_port + ', ws_nid:' + attr.ws_nid +'})');
  html.push("</script>");

  // display the user id
  html.push("<div><b>Hello, World!</b> This is User ID=" + attr.user_id + ' [<a href="/reset">Reset</a>]</div>');

  // display notice that websockets has connected
  html.push('<div id="world-notice"></div>');

  // user interface to send and receive messages
  html.push('<div><form id="say-form"><input type="text"><input type="button" value="Say Something" onclick="HelloWorldClient.say_it()"/></form></div>');
  html.push('<div id="world-reply"></div>');
  
  html.push("</body>");
  html.push("</html>");

  // return a string of html
  return html.join("\n");

}
```

### The "Index" Route

The index route serves the main page of the Hello World system, performing the following actions on each request:

* Retrieve or create a user
* Select a random websocket node (demonstrating the use of multiple websocket servers)
* Start the Whisk session sync beween web and websockets
- Enable the websockets service to confirm that the connecting client originates from the index route
- Provide the websockets service with the user id of the connecting client
* Render the view function

```js
app.get('/', function(req, res) {
  var user;

  // randomly choose a websocket port
  var ws_nid = Math.floor(Math.random() * Config.websocket.ports.length);
  var ws_port = Config.websocket.ports[ws_nid];

  // no user in session: 
  //  create and set user in the session
  if (typeof req.session.user === 'undefined') {
    user = {id: Whisk.Auth.random_hash()};
    req.session.user = user;

  // get user from session
  } else {
    user = req.session.user
  }

  Whisk.context.log('info', 'HelloWorld web request by User ID=' + req.session.user.id + ', will use ws-' + ws_nid + '.');

  // start the session sync on the web-side, will be completed on the websockets-side
  // get the whisk session sync token for use in the view function
  // NOTE: session id and user id are required attributes
  Whisk.Auth.start_ws_session_sync({
    sid: Whisk.Auth.get_sid_from_web_req_cookies(req.cookies),
    user_id: user.id
  }, function(ws_token, err) {

    // call the view function
    res.send(render_html({ user_id: user.id, ws_token: ws_token, ws_port: ws_port, ws_nid: ws_nid }));

  });

});
```

After the page is served and the websocket session is synchronized, both the web and websockets services can take advantage of having a confirmed user id. This id can then be used to look up the user in the database, receive targeted messages, and so on).

### The "Reset" Route

The reset route allows the user to clear out their session for testing purposes.

```js
// reset user
app.get('/reset', function (req, res) {
  whisk.context.log('info', 'HelloWorld reset session by User ID=' + req.session.user.id + '.');
  req.session.destroy(function() {});
  delete req.sessionID;
  res.redirect('/');
});
```

### Hello World Client Javascript

The client-side aspect of Hello World can perform the following:

* Set the user in the client
* Initialize the message form UI
    - Place cursor on text input
    - Capture when the user hits the return key
* Initialize the Whisk client
    - Pass the ws_token onto Whisk, in order to complete the session sync
    - Define socket.io handlers, either base, whisk, or app
    - Display a notice that the connection is active
* Define a "say_it" function to emit message entered by user in the UI to the "world.say" route
* Define a app handler function to display messages received from "world.reply"

The client functionality is defined in a file named "public/js/HelloWorldClient.js": 

```js
(function (hello_world) {
  hello_world.user = {};

  // init - gets everything started, called from within a script tag in the HTML

  hello_world.init = function (attr, cb) {
    /* attrs:
        user_id
        ws_token - used in the web-ws session sync
        ws_port - websockets on a different port than web
        ws_nid - node id
    */

    // wait until the page is ready
    jQuery(document).ready(function() {

      // set the user, ws_token, ws_port
      hello_world.user.id = attr.user_id;

      // place cursor on the say form
      jQuery('#say-form input[type=text]').focus();

      // capture returns on the say form
      jQuery('#say-form input[type=text]').keypress(function (e) {
        if (e.which == 13) { hello_world.say_it(); return false; }
      });

      // initialize the Whisk websockets client library 
      // NOTE: whisk will complete the web-ws session sync using the ws_token
      Whisk.WebSocket.init({
        config: { websocket: { port: attr.ws_port } },
        ws_token: attr.ws_token,
        routes: {
          base: {},
          whisk: {},
          app: {

            // socket.io handler for received messages
            'world.reply': {
              'handler': function (payload) {
                jQuery("#say-form input[type=text]").val(''); // clear the value
                jQuery("#world-reply").html(payload.message);
              }
            },

          },
        }
      }, function () {

        // called when websockets is connected and session confirmed with ws_token
        console.log('Hello World Client: Whisk is connected!');
        jQuery('#world-notice').html('Connected to ws-' + attr.ws_nid);

      });

    });

  }

  // say it

  hello_world.say_it = function (attr) {
    console.log('HelloWorld.say_it: ', attr);
    Whisk.WebSocket.sio.emit('world.say', {
      message: jQuery("#say-form input[type=text]").val()
    });
  }

}) (( window.HelloWorldClient=window.HelloWorldClient || {}));
```

## WebSocket Service

In a file named "websocket_service.js", the config, context, and Whisk initialization code is added. In the Hello World example, three websocket servers are defined in the config having node ids of 0, 1, or 2. The node id is set in the environment as "WS_NID". Once these are loaded, the websocket service is started, allowing for the definition of a callback after the session has been confirmed using the ws_token. 

In order to provide incoming and outgoing message processing for websockets, Whisk enables you to define separate files for socket.io routes (incoming messages) and observers (outgoing messages). This important functionality is loaded when Whisk runs the websocket service, and is described later.

```js

// define the ws cipher nid and port
var ws_nid = (process.env.WS_NID ? parseInt(process.env.WS_NID) : 0);
var ws_port = (process.env.WS_NID ? Config.websocket.ports[parseInt(process.env.WS_NID)] : Config.websocket.ports[0]);

// websocket service initialization
Whisk.init({
  context: context,
  port: ws_port,
  cipher: {  namespace:'ws', nid:ws_nid },
  redis: { port: Config.redis.port },
});

// run the websocket service
Whisk.run_websocket_service({
  
  // called once the ws_token has been confirmed
  confirm_ws_session_sync_success: function (err, attr) {
    /* attrs:
        session_sync_data - data from the confirmation
        socket - this user's socket
    */

    Whisk.context.log('info', 'Hello World whisk confirm_ws_session_sync_success: ws session confirmed for user_id=' + attr.session_sync_data.user_id);

  }

});
```

Take note that the user_id is available from the session sync. This allows users to be looked up by all functions defined to handle incoming and outgoing messages.

### World Routes

Route functions are defined to handle incoming messages. Whisk detects *Route.js files stored in the "routes" directory, and loads the named functions as socket.io listeners. In Hello World, a "world.say" listener is defined in a file named "routes/WorldRoute.js". This function is triggered when the web client calls an emit to "world.say", sending a message over websockets to the appropriate Whisk websocket server.

```js
var Whisk = require("rapt-whisk-router");
var Cipher = Whisk.Cipher.getInstance();
var whisk_handle = Whisk.Router.define_route("world");

// world.say handler

whisk_handle.on('say', function (socket, session, payload) {
  Whisk.context.log('info', 'Whisk.WorldRoute.say ' + payload.message + ' from user_id=' + socket.store.user_id + ' / socket id=' + socket.id);

  var reply_message = 'User ID=' + socket.store.user_id + ' said "' + payload.message + '" to the world!';

  // broadcast the reply back out to all clients via the WorldObserver
  Cipher.broadcast("world.reply", {
    message: reply_message,
    originating_message: payload.message,
    originating_user_id: socket.store.user_id,
  }, {ns: "ws"});

});
```

### World Observers

Observer functions are defined to handle outgoing messages. Whisk detects *Observer.js files stored in the "observers" directory, and Cipher loads the named functions. In Hello World, a "world.reply" observer is defined in a file named "observers/WorldObserver.js". This function is triggered when any part of the Whisk system broadcasts to "world.reply" using Cipher, causing Whisk to then send a message to the appropriate Whisk websocket clients.

```js
var Whisk = require("../../../");
var Cipher = Whisk.Cipher.getInstance();
var sio = Whisk.Config.io_instance();

// world.reply broadcaster

Cipher.onBroadcast("world.reply", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.WorldObserver.reply ' + payload.message);

  // send the reply out to all clients connected to this Whisk server
  sio.sockets.in().emit("world.reply", payload);

});
```

It is important to note that in this implementation, all three websocket servers will send "world.reply" out to each of their connected clients. Using the user id session store in each socket.io connection, an observer implementation can send messsages out to specific clients.

## Run Hello World

Make sure redis is running first before starting Hello World.

Run the following commands, in separate terminals:

```
node web_server.js

WS_NID=0 node websocket_server.js

WS_NID=1 node websocket_server.js

WS_NID=2 node websocket_server.js
```

# The Code

The [hello-world](examples/hello-world) example implementation files have also been saved among the examples for your convenience.

