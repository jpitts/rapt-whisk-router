/*

  So Basic Web Server

*/


/* 
  node module dependencies
*/

var express = require('express')
  , partials = require('express-partials')
  , whisk = require("../../../")
  , SOBA = require('../lib/SoBasic')
;

/*
  configuration
*/

// service configs
var web_cfg = SOBA.config.web;
var redis_cfg = SOBA.config.redis;

SOBA.log('info', 'Web Service ' + web_cfg.CIPHER_NS + '.' + web_cfg.CIPHER_NID + ' init.');

// set up whisk
whisk.init({
  context: SOBA,
  port: web_cfg.port,
  base_path: __dirname,
  cipher: {  namespace: web_cfg.CIPHER_NS, nid: web_cfg.CIPHER_NID },
  redis: redis_cfg,
});
// NOTE: also provides a rapt-cipher instance


// express
var app = express();


// express configuration
var configure_express = function (app, whisk) {
  
  // ejs views
  app.set('views', __dirname + '/views'); 
  app.use( partials() ); 
  // SEE: https://github.com/publicclass/express-partials AND http://embeddedjs.com/
  
  // static files
  app.use(express.static(__dirname + '/public'));

  // index route

  app.get('/', function(req, res){

    // init user
    init_user({ req:req, res:res }, function (err, attr) {
      
      // now start the whisk confirmation process
      
      // session sync data
      var session_sync_data = {
        sid: whisk.Auth.get_sid_from_web_req_cookies(req.cookies),
        user_id: attr.user.id
      }; 
      // NOTE: this data will be made available to the confirm_ws_session_sync callbacks
      
      // get the ws session sync token
      whisk.Auth.start_ws_session_sync(session_sync_data, function(ws_token, err) {
       
        res.render('index.ejs', {
          layout:false,
          ws_token: ws_token,
          user: attr.user,
          service_cfg: SOBA.config
        });

      });

    });

  }); // END index route

} 


/*
  utility functions
*/

// init user
// sets up a new or returning user

var init_user = function init_user (attr, cb) {

  /* attrs:
      req
      res
  */

  // set up a lightweight session
  if (typeof attr.req.session.user === 'undefined') {
    
    var user = { id: whisk.Auth.random_hash(), location_id: 'world' };  
    
    // create a user record 
    SOBA.Models.User(user).create(function(err, created_user) {

      if (err) { SOBA.log('error', err); return cb(err, undefined); }
      attr.req.session.user = {id: created_user.id};
      
      SOBA.log('info', 'Create a new user id=' + created_user.id);
        
      // callback  
      cb(err, { user: created_user });

    });

  // fetch the user using session data
  } else {
   
    // get the user
    SOBA.Models.User().read(attr.req.session.user.id, function (err, user) {
      if (err) { SOBA.log('error', err); return cb(err, undefined); }
      if (!user) { 
        var err_msg = 'Could not find user id=' + attr.req.session.user.id;
        SOBA.log('error', err_msg); 
        return cb(err_msg, undefined); 
      }
      
      SOBA.log('info', 'Read returning user id=' + user.id);
      
      // callback  
      cb(err, { user: user });

    });

  }

}


/* 
  start
*/

// run the web service
whisk.run_web_service({
  base_path: __dirname,
  express_app: app,
  on_express_init: configure_express,
});




