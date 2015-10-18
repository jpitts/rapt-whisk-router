/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

// Handler for the external interface
var API = module.exports = exports;

// Load in the default configuration (will be initialized in run)
var Config = API.Config = require("./config");

// Load in the router class
var Router = require("./router");
API.Router = new Router({ whisk: API });

// Load in web and websockets
var WSLoader = API.WSLoader = require("./websocket_loader"); 
var WebLoader = API.WebLoader = require("./web_loader"); 

// Distributed Store - Base assumption is redis - no case made for in-memory
//var Express_RedisStore = API.Express_RedisStore = require("./express-redisstore");
var Modelrizerly = API.Modelrizerly = require("rapt-modelrizerly");

// Redis module - defines the redis pub, sub, and client
var Redis = API.Redis = require("./redis");

// Authorization module - still a work in progress
var Auth = API.Auth = require("./auth");
Auth.init({ whisk: API }, function () {});

// Cipher module
var Cipher = API.Cipher = require("./cipher");

// Winston
var Winston = require("winston");

API.context = undefined;
API.port = undefined;


/*
  init
  
  sets up critical attributes
  initializes cipher and the redis store

*/

API.init = function (attr) {

  /* attrs:
      context - contains config and a log method (winston logger)
      port
      base_path
      websocket_routes_path
      websocket_observers_path
      cipher
        namespace
        nid
      redis
        host
        port
        options
      logger
      log
  */
  
  // context (allows the implementation to specify the logging method)
  // make sure that context contains logger and log
  if (!attr.context) attr.context = {};
  if (!attr.context.logger) { // default logger is winston
    attr.context.logger = new (Winston.Logger) ({ });
    attr.context.logger.add(Winston.transports.Console)
  }
  if (!attr.context.log) { // make logging a bit easier
    attr.context.log = function log (level, message, logdata) {
      attr.context.logger.log(level, message, logdata||{});
    }
  }
  if (!attr.context.config) { // for modelrizerly
    attr.context.config = { redis: attr.redis };
  }
  attr.context.log('info', 'Whisk initialization.');
  // done with context

  // init the config
  API.Config.init(attr);

  // set the default port
  API.port = (typeof attr.port !== 'undefined') ? parseInt(attr.port) : 80;
  
  // set whisk in the attrs
  attr.whisk = API;
   
  // set the context
  API.context = attr.context;
 
  // fire up the session store
  require('./session');
  API.Models = Modelrizerly.init({ context: attr.context });
  
  // fire up cipher
  API.Cipher.init(attr);
  
  // configure the whisk redis store
  API.Redis.init(attr);

  return API;

}


/* 
  run web serice
  
  express-based web server for use with the whisk websocket service
  
  Notes:
  - allows the implementation to configure express
  - defines routes for client javascript and web APIs
  - must be run on a separate port than whisk websocket services

*/

API.run_web_service = function (attr, runcb) {

  /* attrs:
      on_express_init
  */

  API.context.log('info', 'Start the Whisk websocket service.');
  
  // TODO: these should be set on construction
  attr.whisk = API;
  attr.context = API.context;

  // load web service, routes, static files
  WebLoader.init(attr, function (err, expressApp) { 

    // callback    
    if (runcb) {
      runcb(err, API);
    }
  
  });

}


/*
  run websocket service
  
  socket.io-based websocket server
  
  Notes:
  - enables the implementation to define incoming routes and outgoing observers
  - must be run on a separate port than whisk web services

*/

API.run_websocket_service = function (attr, runcb) {

  /* attrs:
      on_connection - function called when the websocket client connects
      confirm_ws_session_sync_success - after the session sync has completed successfully
      confirm_ws_session_sync_failure - session sync failed
      confirm_ws_session_sync_error - session sync generated an error
      on_disconnect - function called when the websocket client disconnects
  */
  
  API.context.log('info', 'Start the Whisk websocket service.');

  // TODO: these should be set on construction
  attr.whisk = API;
  attr.context = API.context;

  // load websockets, routes (incoming) and observers (outgoing)   
  WSLoader.init(attr, function (err, io_instance) {    
    
    // callback    
    if (runcb) {
      runcb(err, API);
    }

  });
}

// logger functions
// ========================================================================================

/* log  
  
  conveniences for interacting with the winston logger
  - tracer for use in connecting log calls
*/

var log = API.log = function log (message, attr) {

  /* attrs:
      level
      session
      block
      classname || observer || router
      subject
      subject_id
      tracer_id
      log_data
  */

  // defaults
  var level = (typeof attr.level !== 'undefined') ? attr.level : 'info';
  var tracer_id = (typeof attr.tracer_id !== 'undefined') ? attr.tracer_id : ( Math.floor(Math.random()*90000000) + 10000000);
  var block = attr.block; 
  //var classname = (typeof attr.classname !== 'undefined') ? attr.classname : API.context.name + '.Controllers.' + attr.controller;
 
  var classname;
  switch (true) { 
    case (typeof attr.classname !== 'undefined'): 
      classname = attr.classname;
      break;
    case (typeof attr.observer !== 'undefined'):
      classname = API.context.name + '.Observer.' + attr.observer;
      break;
    case (typeof attr.router !== 'undefined'):
      classname = API.context.name + '.Router.' + attr.router;
      break;
    default: 
      classname = API.context.name + '.Whisk';
      break;
  };  

  // define the log data
  var log_data =  {
    router: attr.router,
    observer: attr.observer,
    classname: classname,
    module: 'whisk',
    block: block,
    tracer_id: tracer_id
  };
  
  // subject id
  if (typeof attr.subject_id !== 'undefined') {
    log_data.subject_id = attr.subject_id;
  }

  // player
  if (attr.session && attr.session.player) {
    log_data.session_player_id = attr.session.player._id;
    log_data.session_player_urn = attr.session.player.urn;
  }

  // extra log data
  if (typeof attr.log_data !== 'undefined') {
    for (var key in attr.log_data) {
      log_data[key] = attr.log_data[key];
    }
  }

  // log the message
  API.context.log(message, log_data);

  return {tracer_id:tracer_id, block:attr.block, controller:attr.controller };

}


var log_info = API.log_info = function log_info (message, attr) { 
  if (!attr) {console.error('Whisk.log_info called without attrs.'); return;} 
  attr.level = 'info'; 
  return API.log(message, attr); 
}
var log_warn = API.log_warn = function log_warn (message, attr) {  
  if (!attr) {console.error('Whisk.log_warn called without attrs.'); return;} 
  attr.level = 'warn'; 
  return API.log(message, attr); 
}
var log_error = API.log_error = function log_error (message, attr) { 
  if (!attr) {console.error('Whisk.log_error called without attrs.'); return;} 
  attr.level = 'error'; 
  return API.log(message, attr); 
}

// log start block
// called at the beginning of functions, the output used in order to trace

var log_start_block = API.log_start_block = function log_start_block (attr) {
  
  /* attrs:
      session
      block
      classname || observer || router
      subject
      subject_id
      append_message
      log_data
  */

  //console.log('modelrizerly.models.log_start_block ', attr);

  // define the message
  var log_message;
  switch (true) { 
    case (typeof attr.classname !== 'undefined'): 
      log_message = "Called " + attr.block + ' on ' + attr.classname;
      break;
    case (typeof attr.observer !== 'undefined'):
      log_message = "Called " + attr.block + ' on the ' + attr.observer + ' observer';
      break;
    case (typeof attr.router !== 'undefined'):
      log_message = "Called " + attr.block + ' on the ' + attr.router + ' router';
      break;
    default: 
      log_message = "Called " + attr.block;
      break;
  };

  // append the message
  if (typeof attr.append_message !== 'undefined') {
    log_message = log_message + ': ' + attr.append_message;
  } else {
    log_message = log_message + '.';
  }

  return API.log_info(log_message, attr);

}

// In case the serialization format changes
var deserialize = API.deserialize = function deserialize(raw_msg) {
  return JSON.parse(raw_msg);
}

// In case the serialization format changes
var serialize = API.serialize = function serialize(json_msg) {
  return JSON.stringify(json_msg);
}




