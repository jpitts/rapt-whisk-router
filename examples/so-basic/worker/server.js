/*

  So Basic Worker

*/


/* 
  node module dependencies
*/

var whisk = require("../../../")
  , cipher = require('rapt-cipher')
  , SOBA = require('../lib/SoBasic')
;


/*
  configuration
*/

// service configs
var worker_cfg = SOBA.config.worker;
var redis_cfg = SOBA.config.redis;

SOBA.log('info', 'Worker Service ' + worker_cfg.CIPHER_NS + '.' + worker_cfg.CIPHER_NID + ' init.');

// cipher client
var Cipher = cipher.init({
  namespace: worker_cfg.CIPHER_NS,
  nid: worker_cfg.CIPHER_NID,
  redis: redis_cfg
});

// define the cipher tenent handler
Cipher.tenentHandler = function tenentHandler(recipient, cb) {
  console.log(worker_cfg.CIPHER_NS + '.' + worker_cfg.CIPHER_NID + ' tenentHandler recipient ', recipient);

  // get the user (this can be used in cases of multiple workers each responsible for a pool of users)
  SOBA.Models.User().read(recipient.tid, function (err, user) {
    if (err) {console.error('Whisk.LocationRoute.chat: could not retrieve user id='+ recipient.tid + ': ' + err); return;}
    if (!user) {console.error('Whisk.LocationRoute.chat: Could not retrieve user id=' + recipient.tid);return;}
    cb(user);
  });

}


/*
  incoming routes
*/

var LocationRoute = require('./routes/LocationRoute');
LocationRoute.init({
  context: SOBA,
  cipher: Cipher,
});


// finally, start listening
SOBA.log('info', 'Worker ' + worker_cfg.CIPHER_NS + '.' + worker_cfg.CIPHER_NID + ' ready to receive messages.');


