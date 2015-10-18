/*

  So Basic WebSocket Server

*/


/* 
  node module dependencies
*/

var Whisk = require("../../../")
  , SOBA = require('../lib/SoBasic')
;

/*
  configuration
*/

// service configs
var ws_cfg = SOBA.config.websocket;
var redis_cfg = SOBA.config.redis;

SOBA.log('info', 'Websocket Service ' + ws_cfg.CIPHER_NS + '.' + ws_cfg.CIPHER_NID + ' init.');

// set up whisk
Whisk.init({
  context: SOBA,
  port: ws_cfg.port,
  base_path:__dirname, 
  cipher: {  namespace: ws_cfg.CIPHER_NS, nid: ws_cfg.CIPHER_NID },
  redis: redis_cfg,
});


/* 
  start
*/

// run the websocket service
Whisk.run_websocket_service({

  confirm_ws_session_sync_success: function (err, attr) {
    /* attrs:
        session_sync_data - data from the confirmation
        socket - this user's socket
        session - modelrizerly model
    */

    if (err) {
      SOBA.error('info', 'SOBA whisk confirm_ws_session_sync_success: yet there was an error: ' + err);
    } else {
      SOBA.log('info', 'SOBA whisk confirm_ws_session_sync_success: ws session confirmed for user_id=' + attr.session_sync_data.user_id);
    }
    
    // fetch the user
    SOBA.Models.User().read(attr.session_sync_data.user_id, function(err, user) {
      
      // get the cipher address for this websocket connection
      var addr = Whisk.Auth.get_cipher_address_from_ws({ socket: attr.socket });
      
      // set the cipher address in the user model
      user.set_cipher_address(addr, function (err) {
        if (err) { SOBA.log('error', 'Could not update the user cipher address: ' + err); return; }
      });
      
      // store the location id in the socket session
      // commented out while migrating to socket.io-1.3
      // attr.socket.store.location_id = user.location_id;
      attr.session.update_store({ $set: { 'location_id': user.location_id }}, function(err, updated_store) {
        SOBA.log('info', 'updated store.');
        console.log(updated_store);
      });
      // NOTE: this is to speed up the transmission of location-specific messages to clients
      
      // announce that the user has entered
      Whisk.Cipher.getInstance().transmit(
        "location.enter", 
        {location_id: user.location_id, user_id: user.id}, 
        {ns: "worker", tid: user.id}
      );
      
    }); // END user model read

  } // END confirm ws session sync success

}, function (err, whisk) {
  if (err) {
    SOBA.log('error', 'SOBA whisk init: whisk could not be started: ' + err);
    return;
  }

  SOBA.log('info', 'SOBA whisk init: now running!');
}); // END run websocket service


// log the init
var logged_start = Whisk.log_start_block({
  subject: 'service', class_type: 'websocket_server', block: 'init', module: 'whisk',
  append_message: 'Start whisk '+ ws_cfg.CIPHER_NS + '.' + ws_cfg.CIPHER_NID + ' service on port=' + ws_cfg.port + '.',
});

