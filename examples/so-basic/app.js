/*

  "So Basic" All-In-One Test Stack

  This runs the so-basic stack for testing and demo purposes. If run, app.js will
  start a web server, a websocket server, and a worker as separate node.js processes 
  managed by a forever-monitor.
  
  Requirements: a redis instance is required to be running. There are instructions 
  in the vendor directory about downloading and running redis.
  
*/


/* 
  node module dependencies
*/

var forever = require('forever-monitor')
  , winston = require('winston')
  , SOBA = require('./lib/SoBasic')
;

SOBA.log('info','Start the So Basic stack!',{});

/*
  start and monitor the web, websocket, and worker services
*/

["web","websocket","worker"].forEach(function (name, idx) {
  
  // load the configuration for this service
  var cfg = SOBA.config[name];

  // forever monitor 
  cfg.forever_monitor = new (forever.Monitor)(name + '/server.js', { max: 1, silent: false });

  // forever listeners
  cfg.forever_monitor.on('start', function () {
    SOBA.logger.log('info', 'SOBA app.js: ' + cfg.CIPHER_NS + '-' + cfg.CIPHER_NID + ' started.'); 
  });
  cfg.forever_monitor.on('exit', function () {
    SOBA.logger.log('info', 'SOBA app.js: ' + cfg.CIPHER_NS + '-' + cfg.CIPHER_NID + ' exited.'); 
  });
  cfg.forever_monitor.on('error', function (err) {
    SOBA.logger.log('info', 'SOBA app.js: ' + cfg.CIPHER_NS + '-' + cfg.CIPHER_NID + ': ' + err + '.'); 
  });
  
  // start the service
  cfg.forever_monitor.start();

});


