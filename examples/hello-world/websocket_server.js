var Whisk = require("../../");
var Config = require('./config');

var ws_nid = (process.env.WS_NID ? parseInt(process.env.WS_NID) : 0);
var ws_port = (process.env.WS_NID ? Config.websocket.ports[parseInt(process.env.WS_NID)] : Config.websocket.ports[0]);
var ws_host = (process.env.HEWO_WS_HOST ? process.env.HEWO_WS_HOST : 'localhost');
var redis_host = (process.env.HEWO_REDIS_HOST ? process.env.HEWO_REDIS_HOST : 'localhost');

// set up whisk
Whisk.init({
  port: ws_port,
  cipher: {  namespace:'ws', nid:ws_nid },
  redis: { host: redis_host, port: Config.redis.port },
});

// run the websocket service
Whisk.run_websocket_service({

  confirm_ws_session_sync_success: function (err, attr) {
    /* attrs:
        session_sync_data - data from the confirmation
        socket - this user's socket
    */

    Whisk.context.log('info', 'Hello World whisk confirm_ws_session_sync_success: ws session confirmed for user_id=' + attr.session_sync_data.user_id);

  }

});

