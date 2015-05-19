/*

  So Basic Context Module

  Provides application context to Whisk and Cipher

  API:
    config
    logger
    log
    Models

*/


// node module dependencies
var Modelrizerly = require("rapt-modelrizerly")
  , ModelLoader = require("../models/bootloader")
  , winston = require('winston')
;


// exports
var SOBA = module.exports = exports;


// config
SOBA.config =  {
  web: {host:'localhost', port:9090, CIPHER_NS:'web', CIPHER_NID:0 },
  websocket: {host:'localhost', port:9091, CIPHER_NS:'ws', CIPHER_NID:0 },
  worker: {host:'localhost', port:9092, CIPHER_NS:'worker', CIPHER_NID:0 },
  redis: { host:'127.0.0.1', port:6379, options:{} }
};

// winston logger
SOBA.logger = new (winston.Logger) ({ });
SOBA.logger.add(winston.transports.Console);
SOBA.log = function log (level, message, attr) {
  SOBA.logger.log(level, message, attr||{});
}

// modelrizerly models
SOBA.Models = Modelrizerly.init({ context: SOBA });


