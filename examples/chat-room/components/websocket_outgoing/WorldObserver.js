
/* 
  whisk and cipher init
*/

var Cipher = require("rapt-cipher").getInstance({ 
      namespace: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'ws', 
      nid: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0 
    })
  , Whisk = require("../../../../")
  , IO = Whisk.Config.io_instance()
;

/*
  application context
*/

var API = module.exports = exports;
var Models;


// init

API.init = function init (attr) {
  console.log('outgoing world observer init');
  Models = attr.models;
}


// world.add_user_to_location

Cipher.onBroadcast("world.add_user_to_location", function(origin, tenent, payload) {
  Whisk.context.log('info', 'Whisk.WorldObserver.add_user_to_location: user id=' + payload.user_id + ' to location id=' + payload.location_id + '');
  //console.log('payload: ', payload); 
  //console.log('origin: ', origin);
  //console.log('tenent: ', tenent);

  Whisk.Auth.get_session({user_id: payload.user_id}, function (err, session ) {
    if (err) console.error(err);
    console.log('get whisk session: ' + session.sid);
    
    // update the session with the new location
    session.update_store({ $set: { 'location_id': payload.location_id }}, function(err, updated_store) {

      if (err) { console.error(err); }
      console.log('updated session with location_id=' + updated_store.location_id);    

    });
 
  });

 
  /*
  // temporary hack to enable rooms
  var clients = IO.sockets.clients();
  for (var i=0; i<clients.length; i++) {
    //console.log('change location test ' + clients[i].id + '==' + payload.user_cipher_address.tid);
    if (clients[i].id == payload.user_cipher_address.tid) {
      //console.log('set room name to ' + payload.location_id);
      //clients[i]._room_name = payload.location_id;
      //console.log('change location to id=' + payload.location_id + ' in websocket for id=' + clients[i].id);
      clients[i].store.location_id = payload.location_id;
    }
  }
  */

  // join the room using the socket id from the user
  /*
  if (payload.user_cipher_address && IO.sockets.socket(payload.user_cipher_address.tid)) {
    IO.sockets.socket(payload.user_cipher_address.tid).join(payload.location_id);
  } else {
    Whisk.context.log('error', 'Whisk.WorldObserver.add_user_to_location: could not add user id=' + payload.user_id + ' to location id=' + payload.location_id + ' in the socket!');
  }
  */

 
  // broadcast to all clients
  IO.sockets.in().emit("world.add_user_to_location", payload);

});


// world.remove_user_from_location

Cipher.onBroadcast("world.remove_user_from_location", function(origin, tenent, payload) {
  Whisk.context.log('info', 'Whisk.WorldObserver.remove_user_from_location: user id=' + payload.user_id + ' from location id=' + payload.location_id);
  
  // leave the room using the socket id from the user
  /*
  if (payload.user_cipher_address && IO.sockets.socket(payload.user_cipher_address.tid)) {
    IO.sockets.socket(payload.user_cipher_address.tid).leave(payload.location_id);
  } else {
    Whisk.context.log('error', 'Whisk.WorldObserver.remove_user_from_location: could not remove user id=' + payload.user_id + ' from location id=' + payload.location_id + ' in the socket!');
  }
  */
  
  //console.log('origin: ', origin);
  //console.log('tenent: ', tenent);
  
  // broadcast to all clients
  IO.sockets.in().emit("world.remove_user_from_location", payload);

});





