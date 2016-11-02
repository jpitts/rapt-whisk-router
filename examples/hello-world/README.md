# Whisk "Hello World" Demo

An example web app that demonstrates a minimal implementation using a web server, web client code, and three websocket servers. 
## Front-End Features

* Home page in which a user is retrieved or created
* Random websocket node is pre-selected
* UI indicates which websocket server has been connected to
* Message can be added and sent to the websocket server by clicking "Say Something"
* Message received by the websocket server is modified and routed out to all connected clients
* Session reset page

## Technical Summary

This example allows you to run a complete system locally, including a web server and three websocket servers. The use of the Whisk framework to define websockets-related components, standard web programming, and the interconnection between components via Cipher makes it all possible.

How it all runs and how the components fit together are outlined below.

## Installation
    
Whisk requires node.js to be installed. Node 4.6.x is recommended, use [nvm](https://github.com/creationix/nvm) to manage different versions of node if you have not yet found a way to do this.
   
Whisk requires redis to be installed and configured. See the [../vendor/redis](../vendor/redis) directory if you do not yet have redis installed.

Install the node.js dependencies:
```
npm install
```

In order to run tests, please install casperjs. See [CasperJS Installation](http://docs.casperjs.org/en/latest/installation.html).

## Running the hello-world system

Start redis

Run the following commands, in separate terminals:

```
node web_server.js

WS_NID=0 node websocket_server.js

WS_NID=1 node websocket_server.js

WS_NID=2 node websocket_server.js
```
In one or more browsers, go to: http://localhost:8888

In a separate shell, fire up the test calls.
```
./test/run_tests.sh
```
Some things to know about the setup:
* running these commands starts a web server and three websocket servers
* the WS_NID is used to designate the node id (and the port number) for each websocket server
* services are idenfified to cipher as web-0, ws-0, ws-1, and ws-2.

## Configuration

See [config.js](config.js) to examine the system configuration. Here, the web and redis ports are defined, as well as an array of possible websocket ports.

## Structure

The following microservices architecture is used to serve hello-world:

Whisk/express web server calls on Whisk to run the web service, and contains endpoints for the main page and resetting the user session.

HTML is defined in a template function in the web server, allowing the websockets port and node id to be expressed in HTML. 

Client-side functionality allows client Whisk to initialize, as well as defining socket.io listeners. The javascript is served from [public/js/HelloWorldClient.js](public/HelloWorldClient.js).

Whisk/socket.io websocket server calls on Whisk to run the websocket service. The Whisk framework allows for route handlers (for incoming messages) and observer handlers (for outgoing messages) are defined.

## How Cipher fits in

Each service in the hello-world microservices stack contains a cipherer (connection to the Cipher network) listening and potentially transmitting messages. In Whisk, the namespace and nid are set in the node.js environment using CIPHER_NS and CIPHER_NID. The namespace and nid allow messages to be addressed. Additionally, websocket tenent information is transmitted with each message in order to identify the web client that is to receive a message.

SEE the [Cipher developer notes](https://github.com/jpitts/rapt-cipher/blob/master/docs/NOTES.md) to learn more.

## Web and WS sessions

The web server maintains the user. It creates a new user if one is not already present in the express session. Because Whisk WebSockets are running separately from web, it is important to confirm that the WebSockets connection belongs to a particular web user. To this end, each connected WebSockets client and its session is be matched with an express session. 

The confirmation process that begins in the web server. A call is made to start_ws_session_sync in the web server, resulting in the generation of a ws_token. This token in turn is sent to Whisk via the WebSockets connection. Once the ws_token has been confirmed, user_id is set in appropriate the WebSockets connection.

This confirmation occurs each time a web client connects to the hello-world system.

## The web client

The HTML user interface contains the following:
* User ID indicator, with a link to reset the user session
* WebSocket server node id indicator
* form with text entry and "Say Something" button

The HelloWorldClient javascript code implements the following functionality:
* initializing the Whisk WebSockets connection using ws_token
* say_it function that emits user-defined messages to the websockets server
* world.reply listener that displays received messages in the UI

## Defining websocket incoming and outgoing message-handling

Whisk features separate handling for incoming and outgoing messages.

To handle incoming messages, Whisk defines routes files. The "say" route is defined in [routes/WorldRoute.js](routes/WorldRoute.js). As there are more than one websocket server running, "say" messages are modified and then broadcast using "world.reply" via Cipher. This way, clients connected to other servers can receive the reply. 

To broadcast messages back out, Whisk defines observer files. The "world.reply" observer is defined in [observers/WorldObserver.js](observers/WorldObserver.js), and it in this block where each websocket server emits reply messages back out to its connected clients.

## Manually testing hello-world

After starting the system, load http://localhost:8888 into various browsers. It should indicate which websocket server it is connected to. Messages entered in the client UI by clicking on "Say Something" should end up being routed through the hello-world system and then seen by all clients.

