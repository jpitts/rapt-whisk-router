var API = module.exports = exports;
var Whisk = undefined;

// init

API.init = function (attr) {
  Whisk = attr.whisk; // whisk instance
}


/* 
  session sync protocol (between the web app and the ws connection)

  NOTE: this function is used to connect the web session to the ws session.
    start_ws_session_sync() should be called from the web service, then
    within WS_SESSION_SYNC_TIMEOUT seconds, confirm_ws_session_sync() should be called
*/

const WS_SESSION_SYNC_TIMEOUT_c = 10;


// get sid from web req

API.get_sid_from_web_req = function get_sid_from_web_req (req) {

  //console.log('Whisk.Auth cookies: ', req.cookies);
  if (!req.cookies[Whisk.Redis.session.key()]) {
    console.error("Whisk.Auth.get_sid_from_web_req: the sid was not found via req.cookies." + Whisk.Redis.session.key() + "!");
  }

  // some clients fail to store session, this is a fallback
  var sid = req.cookies[Whisk.Redis.session.key()] ? req.cookies[Whisk.Redis.session.key()] : req.sessionID;

  return [Whisk.Redis.session.prefix(), sid].join("")
}


// get sid from web req cookies
// NOTE: will be deprecated, replace with get_sid_from_web_req

API.get_sid_from_web_req_cookies = function get_sid_from_web_req_cookies (cookies) {
  
  console.log('Whisk.Auth.get_sid_from_web_req_cookies will be deprecated! Use Whisk.Auth.get_sid_from_web_req instead.');
  
  //console.log('Whisk.Auth cookies: ', cookies);
  if (!cookies[Whisk.Redis.session.key()]) {
    console.error("Whisk.Auth.get_sid_from_web_req_cookies: the sid was not found via cookies." + Whisk.Redis.session.key() + "!");
  }

  return [Whisk.Redis.session.prefix(), cookies[Whisk.Redis.session.key()]].join("")
}


// get cipher address from ws

API.get_cipher_address_from_ws = function get_cipher_address_from_ws (attr) {

  /* attrs:
    socket
  */
  
  var cipher_address = Whisk.Cipher.getInstance().getAddress();

  return {
    ns: cipher_address.ns,
    nid: cipher_address.nid,
    tid: attr.socket.id,
  };

}


/*
  get session
  
  Notes:
  - requires sid, socket_id, or user_id
  - use whisk.Auth.get_sid_from_web_req(req) to get the sid
  - returns a rapt-modelrizerly obj containing session data

*/

API.get_session = function (attr, cb) {

  /* attrs:
      sid - whisk session id
      socket_id - socket.io socket id
      user_id - implementation user id (must be be unique)
  */
  console.log('Whisk.Auth.get_session() ', attr);

  // get session using the whisk sid
  if (attr.sid) {

    Whisk.Models.Session({ sid: attr.sid }).read(null, function(err, session) { 
      if (err) {
        console.error("Whisk.Auth.get_session: Whisk.Models.Session could not read the session with sid! " + err);
        return cb(err);
      } 
      
      return cb(null, session);
      
    }); 
  
  // get session using user_id
  } else if (attr.user_id || attr.socket_id)  {

    var session_client;

    Whisk.Models.Session({}).find({}, {}, function(err, sessions) { 
      //console.log('find result: ', sessions);
      if (err) {
        console.error("Whisk.Auth.get_session: Whisk.Models.Session could not find the session! " + err);
        return cb(err);
      }

      // matched session client via socket_id
      if (attr.socket_id) {    
        sessions.forEach(function (session, idx) {
          if (attr.socket_id = session.socket_id) {
            return Whisk.Models.Session(session).read(null, function (err, sess_obj) {
              cb(null, sess_obj);
            });
          } else {
            return cb('Whisk.Models.Session could not find the session!'); 
          }
        });

      // matched session client via user_id
      } else if (attr.user_id) {
        sessions.forEach(function (session, idx) {
          if (attr.user_id = session.user_id) {
            return Whisk.Models.Session(session).read(null, function (err, sess_obj) {
              cb(null, sess_obj);
            });
          } else {
            return cb('Whisk.Models.Session could not find the session!'); 
          }
        });

      }

    });

  // not yet implemented
  } else {

    var err = "Whisk.Auth.get_session: Finding session with that attribute not implemented!";
    console.error(err);
    return cb(err);

  }

}



/*
  get websocket sessions
  
  Notes:
  - requires active Whisk.Config.io_instance()

*/

API.get_websocket_sessions = function (attr, cb) {

  /* attrs:
  */

  //console.log("Whisk.Auth.get_websocket_sessions");

  Whisk.Models.Session().find({}, {}, function(err, sessions) {
    if (err) {
      var err = "Whisk.Auth.get_websocket_sessions: Could not find sessions: " + err;
      console.error(err);
      return cb(err);
    }
    
    if (!sessions) {
      var err = "Whisk.Auth.get_websocket_sessions: Could not find any sessions!";
      console.error(err);
      return cb(err);
    }
    
    var active_sessions = [];

    // loop over sessions, only push the active ones
    sessions.forEach(function (sess, idx) { 

      // add client to active sessions if client is in this io instance
      var client = Whisk.Config.io_instance().engine.clients[sess.socket_id];
      if (client) { active_sessions.push(sess); }

    });
    
    cb(null, active_sessions);

  }); // END find sessions

}


// start ws session sync
// used in conjunction with confirm_ws_session_sync to confirm that the web and ws
//  user sessions are of the same client

API.start_ws_session_sync = function start_ws_session_sync (session_sync_data, cb) {

  /* session sync data
      sid - derived from web req cookies (SEE: get_sid_from_web_req_cookies)
      other variables (will be later used in the confirm_ws_session_sync callbacks)
  */

  if (!session_sync_data || !session_sync_data.sid) {
    console.error("Whisk.Auth.start_ws_session_sync: session_sync_data.sid required!");
    return;
  }
  
  var sid = session_sync_data.sid;
  
  // the key used to fetch the sid and other session sync data from redis
  var token = API.random_hash();
  
  //console.log('Auth.start_ws_session_sync for token=' + token + ' and sid=' + sid);
  //console.log('redis session ', Whisk.Redis.session);

  // Async call to store the ws session sync token into redis
  var bound_cb = cb.bind(undefined, token);

  // serialize the session sync data
  var session_sync_json = Whisk.serialize(session_sync_data);
  //console.log('session sync json ' + session_sync_json); 

  //console.log(token);
  Whisk.Redis.redis_client().SETEX(token, WS_SESSION_SYNC_TIMEOUT_c, session_sync_json, bound_cb);
  // SEE: http://redis.io/commands/setex

}


// confirm ws session sync
// - called by the websocket server shortly after a start_ws_session_sync is initiated
// - confirms with the token, calls err, failure, or success
// - creates a session object if success

API.confirm_ws_session_sync = function confirm_ws_session_sync (attr) {

  /* attrs:
    token 
    socket
    error - function to be called on error
    failure - function to be called on failure to confirm
    success - function to be called on success
  */

  Whisk.context.log('info', 'Auth.confirm_ws_session_sync for socket ' + attr.socket.id);

  var err_msg = '';

  // required attributes 

  if (!attr.token) {
    err_msg = 'Error: Cannot call Whisk.Auth.confirm_ws_session_sync: a token is required!';
    console.error(err_msg);
    return;
  }
  if (!attr.socket) {
    err_msg = 'Error: Cannot call Whisk.Auth.confirm_ws_session_sync: a socket is required!';
    console.error(err_msg);
    return;
  }
  if (!attr.error) {
    err_msg = 'Error: Cannot call Whisk.Auth.confirm_ws_session_sync: an error callback function is required!';
    console.error(err_msg);
    return;
  }
  if (!attr.failure) {
    err_msg = 'Error: Cannot call Whisk.Auth.confirm_ws_session_sync: a failure callback function is required!';
    console.error(err_msg);
    return;
  }
  if (!attr.success) {
    err_msg = 'Error: Cannot call Whisk.Auth.confirm_ws_session_sync: a success callback function is required!';
    console.error(err_msg);
    return;
  }

  // fetch the sid (this was recently stored with a call to Whisk.Auth.start_ws_session_sync)
  Whisk.Redis.redis_client().get(attr.token, function(err, session_sync_json) {
    //console.log('session sync json: ' + session_sync_json);
    
    // deserialize the data, get the sid
    var session_sync_data = Whisk.deserialize(session_sync_json); 
    var sid = (session_sync_data && session_sync_data.sid) ? session_sync_data.sid : undefined;
    //console.log(session_sync_data);

    // error
    if (err) {
      Whisk.context.log('error', 'Whisk.Auth.confirm_ws_session_sync: WebSockets session confirmation with token=' + attr.token + ' returned an error: ' + err);

      // emit to the client
      attr.socket.emit("whisk.auth.error", { error: {message: 'WebSockets session confirmation failed with error: ' + err}, ws_token: attr.token});

      // Not very graceful, but the UI/UX design is needed to define a specific denial action
      attr.socket.disconnect();

      // error callback
      return attr.error(err_msg, {
        error: {message: err}, 
        token: attr.token,
        session_sync_data: session_sync_data,
        socket: attr.socket,
      });

    }
    

    // sid record NOT found (failure)
    if (!sid) {
      Whisk.context.log('error', 'Whisk.Auth.confirm_ws_session_sync: WebSockets session confirmation with token=' + attr.token + ' failed!');
      // emit to the client
      attr.socket.emit("whisk.auth.error", {error: {message: 'WebSockets session confirmation failed!'}, ws_token: attr.token});

      // Not very graceful, but the UI/UX design is needed to define a specific denial action
      attr.socket.disconnect();

      // failure callback
      return attr.failure(err_msg, {
        error: {message: err}, 
        token: attr.token,
        session_sync_data: session_sync_data,
        socket: attr.socket,
      });
    

    // success!
    } else {
  
      Whisk.context.log('info', 'Whisk.Auth.confirm_ws_session_sync: WebSockets session confirmed for socket ' + attr.socket.id + ': will store sid ' + sid + ' for token=' + attr.token);
      
      // session data
      var new_sess = {
        whisk: Whisk, // TODO: this should not be here and then storing in redis
        sid: sid,
        user_id: session_sync_data.user_id,
        socket_id: attr.socket.id,
        ws_cipher_address: Whisk.Auth.get_cipher_address_from_ws({ socket: attr.socket }),
        web_session_id: session_sync_data.web_session_id,
      };

      // Assign the sid and accept the socket
      // commented out while migrating to socket.io-1.3 
      //attr.socket.store.sid = sid;
      
      //console.log('testing that the socket id is the token: ' + Whisk.Config.io_instance().sockets.socket(sid));
    
      // set the user and cipher address in the ws session data
      // commented out while migrating to socket.io-1.3 
      //Whisk.context.log('info', 'Whisk.Auth.confirm_ws_session_sync: set user_id and cipher_address in the socket.store.');
      //attr.socket.store.user_id = session_sync_data.user_id;
      //attr.socket.store.cipher_address = Whisk.Auth.get_cipher_address_from_ws({ socket: attr.socket });
      // NOTE: the store is shared across all websocket servers
      
      // set the sid and user_id in this websocket
      attr.socket.whisk_sid = sid;
      attr.socket.whisk_user_id = session_sync_data.user_id;
      
      // set the sid and user_id in the engine client
      var client_ids = Object.keys(Whisk.Config.io_instance().engine.clients); // all client ids
      client_ids.forEach(function (client_id, idx) { // (aside) engine client id should match the socket id
        // find this socket's client in the enigine and set sid and user_id
        if (client_id == attr.socket.id) {
          console.log('Whisk.Auth.confirm_ws_session_sync: set sid and user_id in engine client ' + client_id);
          Whisk.Config.io_instance().engine.clients[client_id].whisk_sid = sid;
          Whisk.Config.io_instance().engine.clients[client_id].whisk_user_id = session_sync_data.user_id;
        }
      });
      
      console.log('Whisk.Auth.confirm_ws_session_sync: init session');

      // init session
      Whisk.Models.Session().init(new_sess, function(err, session) {
        
        Whisk.context.log('info', 'Whisk.Auth.confirm_ws_session_sync: set sid, user_id, and cipher_address in the whisk session.');

        // emit to the client
        attr.socket.emit("whisk.auth.accept", {success: true, ws_token: attr.token});   
        
        // success callback
        return attr.success(null, {
          success: true, 
          token: attr.token,
          session_sync_data: session_sync_data,
          socket: attr.socket,
          session: session
        });

      }); // end init session

    }

  });

}

// random hash

const UINT32_c = 9876543210;
API.random_hash = function random_hash (mod) {
  return (Math.floor(Math.random()*UINT32_c)%(mod||UINT32_c)).toString();
}



