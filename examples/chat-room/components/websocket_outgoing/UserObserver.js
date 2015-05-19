
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

// user.relocate

Cipher.onTransmit("user.relocate", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.UserObserver.relocate for socket id=' + socket.id);
  //console.log(payload);
 
  // send to the client
  if (socket) {  
    Whisk.context.log('info', 'Whisk.UserObserver.relocate emit user.relocate to socket');
    socket.emit("user.relocate", payload);  
  }

});


