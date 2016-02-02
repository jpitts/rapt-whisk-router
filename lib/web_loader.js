/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

var Router = require("./router")
	, express = require("express")

module.exports = exports = new WebLoader();

function WebLoader() {};

var Whisk = undefined;
var context = undefined;
var configured_on_connection = undefined;
var configured_on_disconnect = undefined;

WebLoader.prototype.init = function(attr, cb) {
  
  /* attrs:
      whisk - whisk instance
      context - contains config and logger
      express_app - instance of express
      on_express_init
  */


  /*
  var logged_start = context.log_start_block({
    subject: 'websockets', classname: 'web_loader', block: 'init',
  });
  */
 
  // load attributes
  Whisk = attr.whisk; 
  context = attr.context;   

  attr.context.log('info', 'Whisk.WebLoader.init'); 
  
  // configure express
  var app;
  if (attr.express_app) {
    app = attr.express_app; 
  } else {
    app = express();
  }

  // express middleware 
  app.use(express.cookieParser());
  //app.use(express.bodyParser());
  //app.use(express.methodOverride());

  // express session config
  var RedisStore = require("connect-redis")(express);
  app.use(express.session({
      secret: Whisk.Redis.session.secret()
    , key: Whisk.Redis.session.key()
    , store: new RedisStore({
        prefix: Whisk.Redis.session.prefix()
      , client: Whisk.Redis.redis_client()
    }),
    cookie: {},
  }));
  
  // perform additional express configurations defined in the implementation
  if (attr.on_express_init) {
    attr.context.log('info', 'Whisk.WebLoader.init: perform configurations defined in on_express_init'); 
    attr.on_express_init(app, Whisk);
  }

  // whisk paths

  app.get('/rapt-whisk-router/websocket.js', function(req, res){
      res.sendfile('public/js/websocket.js', {root: Whisk.Config.whisk_path});
  });


  // api user renew ws session
  // called when websockets disconnects and needs to re-establish a connection

  app.get('/rapt-whisk-router/api/renew_ws_session', function (req, res) {
    attr.context.log('info', 'Whisk.WebLoader.get /rapt-whisk-router/api/renew_ws_session: Renew the ws session for user id=' + req.session.user.id);

    // session sync data
    var session_sync_data = {
      sid: Whisk.Auth.get_sid_from_web_req(req),
      user_id: req.session.user.id,
      web_session_id: req.sessionID
    };
    // NOTE: this data will be made available to the confirm_ws_session_sync callbacks


    // get the ws session sync token
    Whisk.Auth.start_ws_session_sync(session_sync_data, function(ws_token, err) {
    // NOTE: used in conjunction with Whisk.Auth.confirm_ws_session_sync in the ws service

      res.json({
        success: true,
        ws_token: ws_token,
        user_id: req.session.user.id,
      });

    });

  }); // END api user renew ws session route


  // start listening
  app.listen(Whisk.port);
  context.log('info', 'Whisk web service now listening on port=' + Whisk.port + '.'); 
  
  // for external access to the express instance
  Whisk.Config.express_instance(app);

  // callback with the express app
  cb(null, app);

}


