/* 
  node modules
*/

var express = require('express')
  , partials = require('express-partials')
  , whisk = require("../../../")
  , cipher = require('rapt-cipher')
  , winston = require('winston')
  , chatRoom = require('../lib/ChatRoom')
;


/*
  worker module  
*/

var Worker = module.exports = exports;


// initialize

Worker.init = function (attr) {

  /* attrs:
      CIPHER_NS
      CIPHER_NID
      context
  */

  // initialize the context (may have already been initialized)
  chatRoom.init(attr.context, function (err, CHRO) {

    CHRO.log('info', 'Worker ' + attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' init.');

    /*
      configuration
      NOTE: to load environment-based config, set NODE_ENV=dev in the shell script call
    */
    
    var service_cfg = CHRO.config;

    
    /* 
      cipher init
    */

    // cipher configuration, with default node and namespace
    var cipher_config = {
      namespace: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'worker',
      nid: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0,
      logger: CHRO.logger,
      log: CHRO.log,
      redis: service_cfg.redis
    };

    var Cipher = cipher.init(cipher_config);

    // define the cipher tenent handler
    Cipher.tenentHandler = function tenentHandler(recipient, cb) {
      console.log('tenentHandler recipient ', recipient);
      cb();
    }


    /*
      incoming routes
    */

    var route_config = {
      context: CHRO,
      cipher: Cipher,
    };

    var WorldRoute = require('./worker_incoming/WorldRoute');
    WorldRoute.init(route_config);

    var LocationRoute = require('./worker_incoming/LocationRoute');
    LocationRoute.init(route_config);


    /*
      worker web service definition
      (for REST calls directly to the worker)
    */

    var app = express();

    // finally, start listening
    app.listen(service_cfg.worker.port);
    CHRO.log('info', 'Worker' + attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' listening on port[' + service_cfg.worker.port + '].');

  }); // END CHRO.init

} // END Worker.init


/* 
  start this worker up
    (if it is running in standalone mode)
*/

if (process.env.CHRO_STANDALONE) {

  // worker
  Worker.init({
    CIPHER_NS: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'worker',
    CIPHER_NID: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
  });

}


