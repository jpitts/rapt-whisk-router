
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

  // get the user id
  Whisk.Auth.get_session({ socket_id: socket.id}, function (err, session) {

    if (err) {
      console.error('Whisk.LocationRoute.chat session could not be retrieved: ' + err);
    }
    
    //console.log("session found sid=" + session.sid + ", user_id=" + session.user_id + ", store=" + session.store);    

    Whisk.context.log('info', 'Whisk.LocationRoute.chat to location_id=' + payload.to_location_id + ' from user_id=' + session.user_id + ' / socket id=' + socket.id);
    //console.log(payload);
      
    // get the user
    Whisk.context.Models.User().read(session.user_id, function (err, user) {
      if (err) {console.error('Whisk.LocationRoute.chat: could not retrieve user id=' + session.user_id + ': ' + err); return;}
      if (!user) {console.error('Whisk.LocationRoute.chat: Could not retrieve user id=' + session.user_id);return;}
      
      // inform the worker
      Cipher.transmit("location.chat", payload, {ns: "worker"});

    });

  }); // END get session

});


