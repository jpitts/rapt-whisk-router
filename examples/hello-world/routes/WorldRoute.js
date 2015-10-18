
var Whisk = require("../../../");
var Cipher = Whisk.Cipher.getInstance();
var whisk_handle = Whisk.Router.define_route("world");

// world.say handler

whisk_handle.on('say', function (socket, session, payload) {
  Whisk.context.log('info', 'Whisk.WorldRoute.say ' + payload.message + ' from user_id=' + socket.whisk_user_id + ' / socket id=' + socket.id);
  
  var reply_message = 'User ID=' + socket.whisk_user_id + ' said "' + payload.message + '" to the world!';

  // broadcast the reply back out to all clients via the WorldObserver
  Cipher.broadcast("world.reply", {
    message: reply_message,
    originating_message: payload.message,
    originating_user_id: socket.whisk_user_id,
  }, {ns: "ws"});

});

