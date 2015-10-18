/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

var Auth = require("./auth")
	, io_m = require("socket.io")

module.exports = exports = new WSLoader();

function WSLoader() {};

// WSLoader.prototype.init = function(server_, config) {
//	config = config || {};

var Whisk = undefined;
var context = undefined;

// configured connection-related callbacks
var configured_cbs = {

  // websockets connected
  on_connection: undefined,

  // for the session sync confirmation process
  confirm_ws_session_sync_success: function (err, data) {
    context.log('info', 'Whisk.WSLoader session sync: ws session confirmed for user_id=' + data.session_sync_data.user_id);
  },
  confirm_ws_session_sync_failure: function (err, data) {
    context.log('info', 'Whisk.WSLoader session sync: ws session failed!');
  },
  confirm_ws_session_sync_error: function (err, data) {
    context.log('info', 'Whisk.WSLoader session sync: ws session confirm error: ' + err);
  },
  
  // websockets disconnected
  on_disconnect: undefined,

};


// init

WSLoader.prototype.init = function(attr, cb) {
  
  /* attrs:
      whisk - whisk instance
      context - contains config and logger
      on_connection
      confirm_ws_session_sync_success
      confirm_ws_session_sync_failure
      confirm_ws_session_sync_error
      on_disconnect
  */


  /*
  var logged_start = context.log_start_block({
    subject: 'websockets', classname: 'websocket_loader', block: 'init',
  });
  */
 
  // load attributes
  Whisk = attr.whisk; 
  context = attr.context;
  attr.context.log('info', 'Whisk.WSLoader.init'); 
  
  // configured callbacks
  Object.keys(configured_cbs).forEach(function (cb_name) {
    if (attr[cb_name]) {
      attr.context.log('info', 'Whisk.WSLoader.init: added ' + cb_name + ' to configured callbacks.'); 
      configured_cbs[cb_name] = attr[cb_name];
    }
  });

  // load routes  
	Whisk.Router.load_route_configs(attr);
	
  // load observers
  Whisk.Router.load_observer_configs(attr);


  // start listening
	Whisk.Config.io_instance(io_m.listen(Whisk.port));
  context.log('info', 'Whisk websocket service now listening on port=' + Whisk.port + '.'); 
  
  // on connection
  Whisk.Config.io_instance().sockets.on("connection", on_connection);
 

  // START configuring socket.io
  // SEE: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
  
  // redis pub/sub    
  // configs from whisk-0.x, commented out while migrating to socket.io-1.3
  //var RedisStore = Whisk.Express_RedisStore;
  //Whisk.Config.io_instance().set("store", new RedisStore({
  //  redisPub: Whisk.Redis.redis_pub()
  //, redisSub: Whisk.Redis.redis_sub()
  //, redisClient: Whisk.Redis.redis_client()
  //}));

  // configs from whisk-0.x, commented out while migrating to socket.io-1.3
  //Whisk.Config.io_instance().set("log level", 1);
  //Whisk.Config.io_instance().enable('browser client minification');
  //Whisk.Config.io_instance().enable('browser client etag');
  //Whisk.Config.io_instance().enable('browser client gzip');

  // configs commented out in whisk-0.x
  //Whisk.Config.io_instance().set("heartbeat timeout", 2);
  //Whisk.Config.io_instance().set("heartbeat interval", 1);

  // DONE configuring socket.io
  
  // init the observers (outgoing signals)
  // NOTE: originally required a bootstrap file due to weird module load orders
  //        removed this as it does not seem to be required
  /*
  require(Whisk.Config.get_observers_path() + "/bootstrap").init({
    context: Whisk.context,
  });
  */

  // callback with the socket.io instance
  cb(null, Whisk.Config.io_instance());

}


// on connection
// called when the client connects

function on_connection(socket) {
  context.log('info', 'Whisk.WSLoader.on_connection: socket.id=' + socket.id); 
  
  /*
  var logged_start = context.log_start_block({
    subject: 'websockets', classname: 'websocket_loader', block: 'on_connection',
    log_data: {websocket_id: (socket ? socket.id : undefined)}
  });
  */

  Whisk.Router.attach_routes_to_socket(socket);
  
  // define the on disconnect
  socket.on('disconnect', on_disconnect);
  // NOTE: this function is defined later on in the WSLoader

  
  // configured on connection listener
  if (configured_cbs.on_connection) {
  // NOTE: defined in the whisk run call, this should contain custom session sync
    
    //context.log('info', 'Whisk.WSLoader.on_connection use configued on_connection for socket.id=' + socket.id);
    configured_cbs.on_connection(socket, Whisk);
 
 
  /* default behaviors: 
    - perform the session sync on connection
  */

  } else {
    
    console.log('connecting with socket.id=' + socket.id); 
        
    // start the ws session sync confirmation process (request the ws_token from the client)
    // NOTE: used in conjunction with Whisk.Auth.start_ws_session_sync in the web service 

    socket.emit("whisk.auth.request", {}, function(payload) {

      // make sure the payload returned contains the ws_token  
      if (payload && payload.ws_token) {
        context.log('info', 'Whisk.WSLoader session sync: ws_token returned from whisk.auth.request ACK callback: ', payload);
      } else {
        context.log('error', 'Whisk.WSLoader session sync: ws_token not returned from whisk.auth.request ACK callback: ', payload);
        return;
      }
      
      // confirm (the callbacks will be returned with user data)
      Whisk.Auth.confirm_ws_session_sync({
        token: payload.ws_token,
        socket: socket,
        success: configured_cbs.confirm_ws_session_sync_success,
        failure: configured_cbs.confirm_ws_session_sync_failure,
        error: configured_cbs.confirm_ws_session_sync_error,
      });

    }); // END whisk.auth.request

  }

}

// on disconnect
// called when the client disconnects

function on_disconnect() {
  //console.log("Whisk: disconnect");
  
  /*
  var logged_start = context.log_start_block({
    subject: 'websockets', classname: 'websocket_laoder', block: 'on_disconnect',
  });
  */

  // configured on disconnect listener 
  if (configured_cbs.on_disconnect) {
    configured_cbs.on_disconnect(Whisk);
  }
  // NOTE: defined in the whisk run function

}



