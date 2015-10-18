var Whisk = require("../../../");
var Cipher = Whisk.Cipher.getInstance();
var sio = Whisk.Config.io_instance();

// world.reply broadcaster

Cipher.onBroadcast("world.reply", function(origin, socket, payload) {
  Whisk.context.log('info', 'Whisk.WorldObserver.reply ' + payload.message);
 
  sio.sockets.emit('world.reply', payload);

});

