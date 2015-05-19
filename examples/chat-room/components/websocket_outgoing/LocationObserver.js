
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
  console.log('outgoing user observer init');
  Models = attr.models;
}

// location.chat

Cipher.onBroadcast("location.add_chat", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.LocationObserver.add_chat from user id=' + payload.from_user_id + ' in location id=' + payload.to_location_id);
  
  //console.log(payload);
  
  //console.log('sockets in ' + payload.to_location_id + ': ', IO.sockets.in(payload.to_location_id).sockets);

  // send to the appropriate clients connected to this websocket server
  // NOTE: this is a temporary hack to enable rooms

  var clients = IO.sockets.clients();
  for (var i=0; i<clients.length; i++) {
    
    // get the client nid (in order to match it to this websocket server's nid)
    var client_nid = (clients[i].store.cipher_address ? clients[i].store.cipher_address.nid : undefined);
    
    //console.log(clients[i].id + ' is on nid=' + client_nid + ' and in location_id=' + payload.to_location_id +  ' ' + (clients[i].store.location_id == payload.to_location_id));
    //console.log('server nid=' + Whisk.Cipher.instance.getAddress().nid);
    //console.log('client nid=' + client_nid);
    
    if (
      // websocket tenent match
      Whisk.Cipher.instance.getAddress().nid == client_nid

      // location match
      && clients[i].store.location_id == payload.to_location_id
    ) {
      
      //console.log('client ' + i + ' store: ', clients[i].store);
           
      // send to all users in location
      if (!payload.to_user_id) {

        console.log('send chat to socket=' +  clients[i].id);
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

        console.log('send chat to socket=' +  clients[i].id + ' belonging to user_id ' + clients[i].store.user_id);
        IO.sockets.socket(clients[i].id).emit("location.add_chat", payload); 

      }

    } // END websocket tenent and location match

  }

});


