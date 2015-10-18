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
 
  console.log(socket);

  // send to the appropriate clients connected to this websocket server
  var client_ids = Object.keys(IO.engine.clients);
  client_ids.forEach(function (id, idx) {
    var client = IO.engine.clients[id];

    //console.log('socket id=' + client.id);
    //console.log('socket whisk_sid=' + client.whisk_sid);

    // get the client cipher nid (in order to match it to this websocket server's nid)
    Whisk.Models.Session().read(client.whisk_sid , function(err, sess) {
      if (err) {
        Whisk.context.log('error', 'Whisk.LocationObserver.add_chat: cannot get session for sid=' + client.whisk_id + ': ' + err);
        return;
      }

      if (!sess) {
        Whisk.context.log('error', 'Whisk.LocationObserver.add_chat: cannot get session for sid=' + client.whisk_id);
        return;
      }

      if (
        // websocket tenent match
        Whisk.Cipher.instance.getAddress().nid == sess.ws_cipher_address.nid

        // location match
        && sess.store.location_id == payload.to_location_id
      ) {

        // send to all users in location
        if (!payload.to_user_id) {
          
          Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: send chat to socket=' +  sess.socket_id);
          if (IO.sockets.connected[sess.socket_id]) {
            IO.sockets.connected[sess.socket_id].emit("location.add_chat", payload);
          }

        // send to specified user in location
        //  also, send to the from_user (so they can see their own message sent)
        } else if (payload.to_user_id && sess.user_id
            && (
              payload.to_user_id == sess.user_id // to_user
              ||
              payload.from_user_id == sess.user_id // from_user
              )
          ) {

          Whisk.context.log('info', 'Whisk.LocationObserver.add_chat: send chat to socket=' +  sess.socket_id + ' belonging to user_id ' + sess.user_id);
          if (IO.sockets.connected[sess.socket_id]) {
            IO.sockets.connected[sess.socket_id].emit("location.add_chat", payload);
          }

        }

      } // END websocket tenent and location match

    }); // END the session lookup

  }); // END loop over client ids

});


// location.add_user

Cipher.onBroadcast("location.add_user", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.LocationObserver.add_user: user id=' + payload.user_id + ' to location id=' + payload.location_id);

  // send to the appropriate clients connected to this websocket server
  var client_ids = Object.keys(IO.engine.clients);
  client_ids.forEach(function (id, idx) {
    var client = IO.engine.clients[id];

    console.log('client id=' + client.id);
    console.log('client whisk_sid=' + client.whisk_sid);

    // get the client cipher nid (in order to match it to this websocket server's nid)
    Whisk.Models.Session().read(client.whisk_sid, function(err, sess) {
      if (err) {
        Whisk.context.log('error', 'Whisk.LocationObserver.add_user: cannot get session for sid=' + client.whisk_id + ': ' + err);
        return;
      }

      if (!sess) {
        Whisk.context.log('error', 'Whisk.LocationObserver.add_user: cannot get session for sid=' + client.whisk_id);
        return;
      }
      
      //console.log('cipher address=',  sess.ws_cipher_address);
      
      // send to user who is at the current location
      if (
        // websocket tenent match
        Whisk.Cipher.instance.getAddress().nid == sess.ws_cipher_address.nid

        // location match
        && sess.store.location_id == payload.location_id
      ) {

        Whisk.context.log('info', 'Whisk.LocationObserver.add_user: send add_user to socket=' +  sess.socket_id);
        if (IO.sockets.connected[sess.socket_id]) {
          IO.sockets.connected[sess.socket_id].emit("location.add_user", payload);
        }

      } // END websocket tenent and location match

    });

  });

});


