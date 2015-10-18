/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

module.exports = exports = function(Whisk, socket, method, path, data, ackcb) {

  //console.log(' whisk running on: ', Whisk.port);
  //console.log(' data: ', data);
  //console.log(' method: ', method);
  //console.log(' path: ', path);
  //console.log(' socket: ', socket);
  //console.log(' ackcb: ', ackcb);

  // get the session store
  Whisk.Models.Session({ sid: socket.whisk_sid }).read(null, function(err, sess) {

		if(err) {
      console.error("Whisk.method_wrapper.socket.get Path: " + path + " Error: ", err);
			return socket.disconnect();
		}

		if(! sess) {
      console.error("Whisk.method_wrapper.socket.get Path: " + path + " Error: Session does not exist for sid=" +  socket.rapt_whisk_router_sid +  ".");
			return socket.disconnect();
		}

    //console.log(' sess store: ', session.store);

		var method_scope = {path: path};
		method.call(method_scope, socket, sess.store, data, ackcb);

  });

}
