# Whisk "So Basic" Demo

An example web app that demonstrates a basic web-based realtime chat system. 

## Front-End Features

* Enter room, session and user retrieved or created
* Notification of other users entering room
* Chat to users in room
* Private chat to user with @<USER_ID>:

## Technical Summary

The features of So Basic require functionality to work in coordination across multiple services, and in web clients. This example allows you to run the entire system locally. The use of the Whisk framework to define websockets-related components, standard web programming, and the interconnection between components via Cipher makes it all possible.

How it all runs and how the components fit together are outlined below.

## Installation and Test Run
    
Whisk requires node.js to be installed. Node 4.6.x is recommended, use [nvm](https://github.com/creationix/nvm) to manage different versions of node if you have not yet found a way to do this.
   
Whisk requires redis to be installed and configured. See the [../vendor/redis](../vendor/redis) directory if you do not yet have redis installed.

Install the node.js dependencies:
```
npm install
```
In order to run tests, please install casperjs. See [CasperJS Installation](http://docs.casperjs.org/en/latest/installation.html).

## Running the so-basic system

Start redis

Start the microservices:
```
node app.js
```         
In one or more browsers, go to: http://localhost:9090

In a separate shell, fire up the test calls.
```
./test/run_tests.sh
```

## Running the so-basic system

[app.js](app.js) defines a minimal means to run components that collectively serve the application on localhost:9090.

Make sure redis is running first before starting so-basic.

Some things to know about app.js:
- runs a web server, websocket server, and a worker using forever-monitor
- services are idenfified to cipher as web-0, ws-0, and worker-0.

## Configuration

See [lib/SoBasic.js](lib/SoBasic.js) to examine the system configuration. Here, web, websocket, worker, and redis ports and cipher info are defined.

### Structure

The following microservices architecture is used to serve so-basic:
* Whisk/express web server
* Whisk/socket.io websocket server
* worker server

The core server-side functionality of so-basic (web, websocket, and worker) are defined in their own directories. 

Client-side functionality is defined in views and public under the web directory. HTML is served from [web/views/index.ejs](web/views/index.ejs). Client-side javascript and css are served from [web/public/](web/public/).

### How Modelrizerly fits in

The so-basic example makes use of [rapt-modelrizerly](https://github.com/jpitts/rapt-modelrizerly) in order to store user data in redis. With only minor modifications, Mongodb can also be easily used by Modelrizerly in so-basic. 

### How Cipher fits in

Each service in the so-basic microservices stack contains a cipherer (connection to the Cipher network) listening and potentially transmitting messages. The namespace and nid are set in the node.js environment using CIPHER_NS and CIPHER_NID. The namespace and nid allow messages to be addressed. Additionally, websocket tenent information is transmitted with each message in order to identify the web client that is to receive a message.

SEE the [Cipher developer notes](https://github.com/jpitts/rapt-cipher/blob/master/docs/NOTES.md) to learn more.


### Defining websocket incoming and outgoing message-handling

Whisk enables the websocket component to provide incoming routes for messages from clients. To this end, routes are defined in [websocket/routes](websocket/routes). 

If messages need to be broadcasted or transmitted back out to clients (and a socket.io instance is not available), Whisk provides outgoing observers. This way, a worker process without any directly connected web client can broadcast messages to many clients, or transmit to one. The observers are defined in [websocket/observers](websocket/observers).

### Defining worker incoming message-handling

The so-basic system provides a worker module that demonstrates how to offload processing from the web and websocket realm. In the so-basic architecture, messages are routed from the websocket service onto a particular function within the worker. The worker routes are defined in [worker/routes](worker/routes).

The worker does not need outgoing message-handling as it merely uses Cipher to send messages out. Whisk running within each of the websocket instances takes care of sending the messages onto the appropriate client(s).

## Logging

This example uses [winston](https://github.com/flatiron/winston) for customizable logging. Winston is also used within Whisk and Cipher.

## Testing so-basic

A basic chat transmission test is located in [test](test).

This test requires phantomjs and casperjs, installed outside of rapt-whisk-router.

Using bash, call run_tests.sh after starting redis and the stack.


