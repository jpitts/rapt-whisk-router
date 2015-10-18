
/*

  Location Whisk Routes
  
  Handles location.* messages coming in from web clients.

*/


/* 
  whisk and cipher init
*/

var Cipher = require("rapt-cipher").getInstance({
      namespace: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'ws',
      nid: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
    })
  , Whisk = require("../../../../")
  , handle = Whisk.Router.define_route("location")
  , IO = Whisk.Config.io_instance();


/* 
  incoming routes
*/


// location.chat

handle.on("chat", function(socket, session, payload) {
  Whisk.context.log('info', 'Whisk.LocationRoute.chat to location_id=' + payload.to_location_id + ' from user_id=' + socket.whisk_user_id + ' / socket id=' + socket.id);
  //console.log(payload);

  // get the user
  Whisk.context.Models.User().read(socket.whisk_user_id, function (err, user) {
    if (err) {console.error('Whisk.LocationRoute.chat: could not retrieve user id=' + socket.whisk_user_id + ': ' + err); return;}
    if (!user) {console.error('Whisk.LocationRoute.chat: Could not retrieve user id=' + socket.whisk_user_id);return;}

    // send chats onto the worker
    Cipher.transmit("location.chat", payload, {ns: "worker", tid: socket.whisk_user_id});

  });

});

