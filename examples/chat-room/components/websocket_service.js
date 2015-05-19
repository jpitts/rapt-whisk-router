
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
      logger: CHRO.logger, log: CHRO.log, 
    });


    /* 
      websocket service definition
    */

    // run the websocket service
    Whisk.run_websocket_service({ 

      // custom on_connection callback
      on_connection: function (socket, whisk) {
        CHRO.log('info', 'CHRO whisk: on_connection for socket id=' + socket.id);  
        
        // start the ws session sync confirmation process (request the ws_token from the client)
        // NOTE: used in conjunction with Whisk.Auth.start_ws_session_sync in the web service 

        socket.emit("whisk.auth.request", {}, function(payload) {

          // make sure the payload returned contains the ws_token  
          if (payload && payload.ws_token) {
            CHRO.log('info', 'CHRO whisk: ws_token returned from whisk.auth.request ACK callback: ', payload); 
          } else {
            CHRO.log('error', 'CHRO whisk: ws_token not returned from whisk.auth.request ACK callback: ', payload); 
            return;
          }
          
          // confirm (the callbacks will be returned with user data)

          whisk.Auth.confirm_ws_session_sync({
            token: payload.ws_token,
            socket: socket,

            error: function (err, data) {
              CHRO.log('info', 'CHRO whisk: ws session confirm error: ' + err); 
            },

            failure: function (err, data) {
              CHRO.log('error', 'CHRO whisk: ws session confiration failed!'); 
            },

            success: function (err, data) {
              /* data:
                  success
                  token
                  session_sync_data
                  socket
              */
              
              CHRO.log('info', 'CHRO whisk: ws session confirmed for user_id=' + data.session_sync_data.user_id); 
              
              // now set the cipher address so that this websocket connection can be directly messaged to

              // fetch the user
              CHRO.Models.User().read(data.session_sync_data.user_id, function(err, user) {
                
                // get the cipher address for this websocket connection
                var addr = whisk.Auth.get_cipher_address_from_ws({ socket: socket });
                //console.log('cipher address: ', addr);
                
                // set the cipher address
                user.set_cipher_address(addr, function (err) {
                  if (err) { CHRO.log('error', 'Could not update the user cipher address: ' + err); return; }
                  CHRO.log('info', 'CHRO whisk: user cipher address updated!');
                });

                // set the user and location in the ws session
                CHRO.log('info', 'CHRO whisk: set user_id and location_id in the socket.store.');
                socket.store.user_id = user.id;
                socket.store.location_id = user.location_id;
                socket.store.cipher_address = addr;
                // NOTE: the store is shared across all websocket servers

              });
              
            }
          });

        }); // END whisk.auth.request
        
      },

      // custom on_disconnect callback

      on_disconnect: function (whisk) {
        CHRO.log('info', 'CHRO whisk: configured on disconnect');  
        
      }
    }, function (err, whisk) {
      CHRO.log('info', 'CHRO whisk: now running!'); 
    
    });

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

