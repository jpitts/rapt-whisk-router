# Whisk Chat Room Demo

An example web app that demonstrates a web-based realtime chat system that can scale horizontally. 

## Front-End Features

* Enter main room, session and user created or retrieved
* Enter other rooms
* Chat to users in room
* Private chat to user with @<USER_ID>:

## Technical Summary

The features of Chat Room require functionality to work in coordination across multiple services, and in web clients. This example allows you to run the entire system locally in a horizontal scaling configuration (both web and websockets have two servers each). The use of the Whisk framework to define websockets-related components, standard web programming, and the interconnection between components via Cipher makes it all possible.

How it all runs and how the components fit together are outlined below.

## Installation and Test Run
    
Whisk requires node.js to be installed. Node 0.10.28 is recommended, use [nvm](https://github.com/creationix/nvm) to manage different versions of node if you have not yet found a way to do this.
   
Whisk requires redis to be installed and configured. See the [../vendor/redis](../vendor/redis) directory if you do not yet have redis installed.

Install the node.js dependencies:
```
npm install
```
Start redis

Start the microservices All-In-One:
```
node app.js
```         
In one or more browsers, go to: http://localhost:8080

In a separate shell, fire up the test calls.
```
./test/chat_transmit_to_individual.sh
```

## Running the chat-room All-In-One

[app.js](app.js) defines a minimal means to run components that collectively serve the application on localhost:8080.

Make sure redis is running first before starting the All-In-One.

Some things to know about the All-In-One:
* runs two websocket servers using forever-monitor, idenfified to cipher as ws-0 and ws-1.
* runs two web servers and a worker directly in the node, idenfified to cipher as web-0, web-1, and worker-0.

## Running chat-room In A Screen Session

The All-In-One is useful for testing and developing. However, to have Whisk and chat-room take full advantage of available computing resources, it is best to run components as separate nodes. [bin/start_test_stack.sh](bin/start_test_stack.sh) and [bin/stop_test_stack.sh](bin/stop_test_stack.sh) can be used to control screens each containing an individual service (including redis).

As you become more familiar with how to run Whisk applications locally with screen, you can start planning out how to distribute the system beyond a single computer.

## Configuration

See [config/environment.js.default](config/environment.js.default) for a default configuration. You can also use environment-based configurations, but without a dev.js or production.js in the config directory, the init in [lib/ChatRoom.js](lib/ChatRoom.js) will load the environment.js.default file for configs.

### Structure

The following microservices architecture is used to serve chat-room:
* proxy server
* 2 Whisk/express web servers
* 2 Whisk/socket.io websocket servers
* worker server

The core server-side functionality of chat-room (proxy, web, ws, and worker) are defined in the [components](components) directory. HTML is served from [views/index.ejs](views/index.ejs). Client-side javascript and css are served from [public](public).

### How Modelrizerly fits in

The chat-room example makes use of [rapt-modelrizerly](https://github.com/jpitts/rapt-modelrizerly) in order to store user and location data in redis. With only minor modifications, Mongodb can also be easily used by Modelrizerly in chat-room. 

### How Cipher fits in

Each service in the chat-room microservices stack contains a cipherer (connection to the Cipher network) listening and potentially transmitting messages. The namespace and nid are set in the node.js environment using CIPHER_NS and CIPHER_NID. The namespace and nid allow messages to be addressed. Additionally, websocket tenent information is transmitted with each message in order to identify the web client that is to receive a message.

SEE the [Cipher developer notes](https://github.com/jpitts/rapt-cipher/blob/master/docs/NOTES.md) to learn more.


### Defining websocket incoming and outgoing message-handling

Whisk enables the websocket component to provide incoming routes for messages from clients. To this end, routes are defined in [components/websocket_incoming](components/websocket_incoming). 

If messages need to be broadcasted or transmitted back out to clients (and a socket.io instance is not available), Whisk provides outgoing observers. This way, a worker process without any directly connected web client can broadcast messages to many clients, or transmit to one. The observers are defined in [components/websocket_outgoing](components/websocket_outgoing).

### Defining worker incoming message-handling

The chat-room system provides a worker module that demonstrates how to offload processing from the web and websocket realm. In the chat-room architecture, messages are routed from the websocket service onto a particular function within the worker. The worker routes are defined in [components/worker_incoming](components/worker_incoming).

The worker does not need outgoing message-handling as it merely uses Cipher to send messages out. Whisk running within each of the websocket instances takes care of sending the messages onto the appropriate client(s).

## Logging

This example uses [winston](https://github.com/flatiron/winston) for customizable logging. Winston is also used within Whisk and Cipher.

## Testing chat-room

A basic chat transmission test using mocha is located in [test](test). Run chat_transmit_to_individual.sh after starting redis and the stack.


