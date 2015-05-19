/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

module.exports = exports = function(socket, method, path, data, ackcb) {

	socket.get(function(err, session) {

    //console.log(' data: ', data);
    //console.log(' method: ', method);
    //console.log(' path: ', path);
    //console.log(' socket: ', socket);
    //console.log(' session: ', session);
    //console.log(' ackcb: ', ackcb);

		if(err) {
      console.error("Whisk.method_wrapper.socket.get Path: " + path + " Error: ", err);
			return socket.disconnect();
		}

		var method_scope = {path: path}
		method.call(method_scope, socket, session, data, ackcb);

	});

}
