/* 
  node module dependencies
*/

var express = require('express')
  , partials = require('express-partials')
  , whisk = require("../../../")
  , cipher = require('rapt-cipher')
  , chatRoom = require('../lib/ChatRoom')
;


/*
  web service module  
*/

var Web = module.exports = exports;


/*
   initialize
*/

Web.init = function (attr) {

  /* attrs:
      CIPHER_NS
      CIPHER_NID
      context
  */

  // initialize the context (may have already been initialized)
  chatRoom.init(attr.context, function (err, CHRO) {

    CHRO.log('info', 'Web Service ' + attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' init.');

    /*
      configuration
      NOTE: to load environment-based config, set NODE_ENV=dev in the shell script call
    */
    
    var service_cfg = CHRO.config;

    // determine the port
    var port = service_cfg.web.nodes[attr.CIPHER_NID].port;

    // set the base path
    var base_path_array = __dirname.split("/");
    base_path_array.pop();
    var base_path = base_path_array.join('/'); 

    // chdir to the base path of the app
    try {
      process.chdir(base_path);
      CHRO.log('info', 'Web Service to run in directory: ' + process.cwd());
    }
    catch (err) {
      console.log('Could not chdir: ' + err);
    }

    // set up whisk
    whisk.init({
      context: CHRO,
      port: port,
      base_path: base_path, 
      cipher: { 
        namespace: attr.CIPHER_NS ? attr.CIPHER_NS : 'web', 
        nid: attr.CIPHER_NID ? attr.CIPHER_NID : 0, 
      },
      redis: service_cfg.redis,
      logger: CHRO.logger, log: CHRO.log,
    });
    // NOTE: also provides a rapt-cipher instance

    
    // express
    var app = express();

    
    /*
      web service definition
    */

    // run the web service
    whisk.run_web_service({
      base_path: __dirname,
      express_app: app,
      on_express_init: function (app, whisk) {
      
        var Cipher = whisk.Cipher;
        
        app.use( partials() ); /* 
        For rendering ejs views. 
        SEE: 
          https://github.com/publicclass/express-partials
          http://embeddedjs.com/
        */
        
        app.use(express.static(base_path + '/public')); /*
        For static files in the public directory
        */


        /*
          define the web routes
        */

        // index

        app.get('/', function(req, res){
          
          // enter world
          // NOTE: this sets up user and location, starts the whisk confirmation process
          Web.enter_world({ req:req, res:res, context:CHRO, whisk:whisk, cipher:Cipher }, function (err, world) {
            
            res.render('index.ejs', { 
              layout:false, 
              ws_token: world.ws_token,
              user: world.user,
              loc: world.loc,
              service_cfg: service_cfg 
            }); 

          });

        });

        
        // user logout
        
        app.get('/user/logout', function(req, res){
          CHRO.log('info', 'Log out user id=' + (req.session && req.session.user ? req.session.user.id : undefined));
          
          req.session.destroy(function() {});
          delete req.sessionID;
          
          res.clearCookie('ws_nid', { path: '/' }); 
          res.clearCookie('web_nid', { path: '/' });
           
          res.redirect('/');
           
        }); // END user logout route

        
        // api user renew ws session
        // called when websockets disconnects and needs to re-establish a connection

        app.get('/api/user/renew_ws_session', function (req, res) {
          CHRO.log('info', 'Renew the ws session for user id=' + req.session.user.id);
          
          
          // session sync data
          var session_sync_data = {
            sid: whisk.Auth.get_sid_from_web_req(req),
            user_id: req.session.user.id
          };
          // NOTE: this data will be made available to the confirm_ws_session_sync callbacks
        
          
          // get the ws session sync token
          whisk.Auth.start_ws_session_sync(session_sync_data, function(ws_token, err) {
          // NOTE: used in conjunction with whisk.Auth.confirm_ws_session_sync in the ws service
          
            res.json({ 
              success: true,
              ws_token: ws_token,
              user_id: req.session.user.id
            });
            
          });

        }); // END api user renew ws session route

      }, // END on express init

    }); // END whisk run_web_service    

  }); // END CHRO.init

} // END Web.init



/*
  utility functions
*/

// enter world
// sets up user and location, starts the whisk confirmation process

Web.enter_world = function enter_world (attr, cb) {

  /* attrs:
      req
      res
      context
      cipher
      whisk
  */

  var req = attr.req;
  var res = attr.res;
  var CHRO = attr.context;
  var whisk = attr.whisk;
  var Cipher = attr.cipher;

  // set up a lightweight session
  if (typeof req.session.user === 'undefined') {
    
    if (!CHRO.config.data || !CHRO.config.data.locations || !CHRO.config.data.locations[0]) {
      var err = 'Could not find a valid default location in the config data!';
      CHRO.log('error', err);
      return cb(err, undefined);
    }

    var loc = CHRO.config.data.locations[0];
    
    var user = { 
      id: whisk.Auth.random_hash(), 
      location_id: loc.id
    };  
    
    // create a user record 
    CHRO.Models.User(user).create(function(err, created_user) {

      if (err) { console.error(err); return cb(err, undefined); }
      req.session.user = {id: created_user.id};
      
      CHRO.log('info', 'Create a new user id=' + created_user.id);

      // get the location
      CHRO.Models.Location().read(created_user.location_id, function (err, loc) {
        if (err) { console.error(err); return cb(err, undefined); }

        // session sync data
        var session_sync_data = {
          sid: whisk.Auth.get_sid_from_web_req(req),
          user_id: req.session.user.id
        }; 
        // NOTE: this data will be made available to the confirm_ws_session_sync callbacks
        
        // get the ws session sync token
        whisk.Auth.start_ws_session_sync(session_sync_data, function(ws_token, err) {
          
          // callback  
          cb(err, { 
            ws_token: ws_token,
            user: created_user,
            loc: loc,
          });
          
        });

      });

    });

  } else {
    
    //console.log('session user: ', req.session.user);

    // get the user
    CHRO.Models.User().read(req.session.user.id, function (err, user) {
      if (err) { console.error(err); }
      
      //console.log('user: ', user);
      
      // get the location
      CHRO.Models.Location().read(user.location_id, function (err, loc) {
        if (err) { console.error(err); }
                
        // session sync data
        var session_sync_data = {
          sid: whisk.Auth.get_sid_from_web_req(req),
          user_id: req.session.user.id
        }; 
        // NOTE: this data will be made available to the confirm_ws_session_sync callbacks

        // get the ws session sync token
        whisk.Auth.start_ws_session_sync(session_sync_data, function(ws_token, err) {

          // callback  
          cb(err, { 
            ws_token: ws_token,
            user: user,
            loc: loc,
          });

        });

      });

    });

  }


}



/* 
  start this web server up 
    (if it is running in standalone mode)
*/
   
if (process.env.CHRO_STANDALONE) {
   
  // web server
  Web.init({
    CIPHER_NS: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'web', 
    CIPHER_NID: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
  });

}



