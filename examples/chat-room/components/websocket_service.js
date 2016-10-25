
// node modules
var http = require('http')
  , Winston = require('winston')
  , Whisk = require("../../../")
  , chatRoom = require('../lib/ChatRoom')
;

/*
  websocket service module  
*/

var WS = module.exports = exports;


// initialize

WS.init = function (attr) {

  /* attrs:
      CIPHER_NS
      CIPHER_NID
      context
  */

  // initialize the context (may have already been initialized)
  chatRoom.init(attr.context, function (err, CHRO) {

    CHRO.log('info', 'Websocket Service ' + attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' init.');

    /* 
      service config
      NOTE: to load environment-based config, set NODE_ENV=dev in the shell script call
    */

    var service_cfg = CHRO.config;

    // determine the port
    var port = service_cfg.websocket.nodes[attr.CIPHER_NID].port;

    // set the base path
    var base_path_array = __dirname.split("/");
    var components_name = base_path_array.pop();
    var base_path = base_path_array.join('/');

    // chdir to the base path of the app
    try {
      process.chdir(base_path);
      CHRO.log('info','WebSocket Service to run in directory: ' + process.cwd());
    }
    catch (err) {
      CHRO.log('error', 'Could not chdir: ' + err);
    }

    // cipher namespace and nid
    var cipher_namespace = attr.CIPHER_NS ? attr.CIPHER_NS : 'ws';
    var cipher_nid = attr.CIPHER_NID ? attr.CIPHER_NID : 0;
    
    // set up whisk
    Whisk.init({ 
      context: CHRO,
      port: port, 
      base_path: base_path,
      websocket_routes_path: components_name + '/websocket_incoming',
      websocket_observers_path: components_name + '/websocket_outgoing',
      cipher: { namespace: cipher_namespace, nid: cipher_nid, },
      redis: service_cfg.redis,
      session: service_cfg.session,
      logger: CHRO.logger, log: CHRO.log, 
    });


    /* 
      websocket service definition
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
          CHRO.error('info', 'CHRO whisk confirm_ws_session_sync_success: yet there was an error: ' + err);
        } else {
          CHRO.log('info', 'CHRO whisk confirm_ws_session_sync_success: ws session confirmed for user_id=' + attr.session_sync_data.user_id);
        }

        // fetch the user
        CHRO.Models.User().read(attr.session_sync_data.user_id, function(err, user) {
          
          // get the cipher address for this websocket connection
          var addr = Whisk.Auth.get_cipher_address_from_ws({ socket: attr.socket });
          //console.log('cipher address: ', addr);
          
          // set the cipher address
          user.set_cipher_address(addr, function (err) {
            if (err) { CHRO.log('error', 'Could not update the user cipher address: ' + err); return; }
            CHRO.log('info', 'CHRO whisk: user cipher address updated!');
          });
          
          // update the session store
          attr.session.update_store({ $set: { 'location_id': user.location_id }}, function(err, updated_store) {
            CHRO.log('info', 'CHRO whisk: set location_id in the socket.store.');

            //console.log(updated_store);
          });

          // set the user and location in the ws session
          // NOTE: commented out while migrating to socket.io-1.3
          //socket.store.user_id = user.id;
          //socket.store.location_id = user.location_id;
          //socket.store.cipher_address = addr;

        });
        
      } // END confirm_ws_session_sync_success callback


    }, function (err, whisk) {
      if (err) {
        CHRO.log('error', 'CHRO whisk init: whisk could not be started: ' + err);
        return;
      }

      CHRO.log('info', 'CHRO whisk init: now running!');
    }); // END run websocket service


    // log the init
    var logged_start = Whisk.log_start_block({
      subject: 'service', class_type: 'websocket_server', block: 'init', module: 'whisk',
      append_message: 'Start whisk '+ attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' service on port=' + port + '.',
    });


  }); // END CHRO.init
    
} // END WS.init


/* 
  start this ws server up
    (if it is running in standalone mode)
*/
   
if (process.env.CHRO_STANDALONE) {
   
  // proxy
  WS.init({
    CIPHER_NS: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'ws', 
    CIPHER_NID: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
  });

}

