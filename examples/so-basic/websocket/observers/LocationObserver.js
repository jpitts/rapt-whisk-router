/*
  
  Location Whisk Observers

  Handles location.* messages going out to web clients.

*/


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
  Whisk.context.log('info', 'Whisk.LocationObserver.init');
  Models = attr.models;
}



// location.add_chat

Cipher.onBroadcast("location.add_chat", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: from user id=' + payload.from_user_id + ' in location id=' + payload.to_location_id);

  // send to the appropriate clients connected to this websocket server

  var clients = IO.sockets.clients();
  for (var i=0; i<clients.length; i++) {

    // get the client nid (in order to match it to this websocket server's nid)
    var client_nid = (clients[i].store.cipher_address ? clients[i].store.cipher_address.nid : undefined);

    if (
      // websocket tenent match
      Whisk.Cipher.instance.getAddress().nid == client_nid

      // location match
      && clients[i].store.location_id == payload.to_location_id
    ) {

      // send to all users in location
      if (!payload.to_user_id) {

        Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: send chat to socket=' +  clients[i].id);
        IO.sockets.socket(clients[i].id).emit("location.add_chat", payload);

      // send to specified user in location
      //  also, send to the from_user (so they can see their own message sent)
      } else if (payload.to_user_id && clients[i].store.user_id
          && (
            payload.to_user_id == clients[i].store.user_id // to_user
            ||
            payload.from_user_id == clients[i].store.user_id // from_user
            )
        ) {

        Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: send chat to socket=' +  clients[i].id + ' belonging to user_id ' + clients[i].store.user_id);
        IO.sockets.socket(clients[i].id).emit("location.add_chat", payload);

      }

    } // END websocket tenent and location match

  }

});


// location.add_user

Cipher.onBroadcast("location.add_user", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.LocationObserver.add_user: user id=' + payload.user_id + ' to location id=' + payload.location_id);

  // send to the appropriate clients connected to this websocket server

  var clients = IO.sockets.clients();
  for (var i=0; i<clients.length; i++) {

    // get the client nid (in order to match it to this websocket server's nid)
    var client_nid = (clients[i].store.cipher_address ? clients[i].store.cipher_address.nid : undefined);

    if (
      // websocket tenent match
      Whisk.Cipher.instance.getAddress().nid == client_nid

      // location match
      && clients[i].store.location_id == payload.location_id
    ) {

      Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: send chat to socket=' +  clients[i].id);
      IO.sockets.socket(clients[i].id).emit("location.add_user", payload);

    } // END websocket tenent and location match

  }

});


