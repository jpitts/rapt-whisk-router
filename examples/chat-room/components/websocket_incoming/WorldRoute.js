
/* 
  whisk and cipher init
*/

var Cipher = require("rapt-cipher").getInstance({
      namespace: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'ws',
      nid: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
    })
  , Whisk = require("../../../../")
  , handle = Whisk.Router.define_route("world")
  , IO = Whisk.Config.io_instance();

/*
  application context
*/

var Models;

/* 
  incoming routes
*/


// world.relocate

handle.on("relocate", function(socket, session, payload) {
  Whisk.context.log('info', 'Whisk.WorldRoute.relocate to location_id=' + payload.location_id);
    
  // NOTE: should be updated so user_id comes from session
  //  (so that the client cannot manually set the user_id in the emit)
    
  // inform the worker
  Cipher.transmit("world.relocate", payload, {ns: "worker"});

});





