
var express = require('express')
  , Whisk = require("../../")
  , Config = require('./config')
;

// whisk init
Whisk.init({
  port: Config.web.port,
  cipher: {  namespace:'web', nid:0 },
  redis: { port: Config.redis.port },
});

// run the web service
Whisk.run_web_service({
  base_path: __dirname,
  on_express_init:  function (app, whisk) {
    whisk.context.log('info','Hello World: Express initialized.');    
   
    // static javascript file
    app.use(express.static(__dirname + '/public'));

    // simple html template
    render_html = function (attr) {
      // attrs:  user_id, ws_token, ws_port, ws_nid
      var html = [];
      html.push("<html>");
      html.push("<head>");
      html.push('<script src="http://localhost:8889/socket.io/socket.io.js"></script>');
      html.push('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>');
      html.push('<script src="/rapt-whisk-router/WebSocket.js"></script>');
      html.push('<script src="/js/HelloWorldClient.js"></script>');
      html.push("</head>");
      html.push("<body>");
      html.push('<style>div { padding:3px; }</style>');
      html.push("<script>");
      html.push('HelloWorldClient.init({ user_id:' + attr.user_id + ', ws_token:' + attr.ws_token + ', ws_port:' + attr.ws_port + ', ws_nid:' + attr.ws_nid +'})');
      html.push("</script>");
      html.push("<div><b>Hello, World!</b> This is User ID=" + attr.user_id + ' [<a href="/reset">Reset</a>]</div>');
      html.push('<div id="world-notice"></div>');
      html.push('<div><form id="say-form"><input type="text"><input type="button" value="Say Something" onclick="HelloWorldClient.say_it()"/></form></div>');
      html.push('<div id="world-reply"></div>');
      html.push("</body>");
      html.push("</html>");
      return html.join("\n");
    }

    /* define routes */

    // index route
    app.get('/', function(req, res) {
      var user;
       
      // randomly choose a websocket port
      var ws_nid = Math.floor(Math.random() * Config.websocket.ports.length);
      var ws_port = Config.websocket.ports[ws_nid];

      // no user in session: 
      //  create and set user in the session
      if (typeof req.session.user === 'undefined') {
        user = {id: Whisk.Auth.random_hash()};
        req.session.user = user;
        
      // get user from session
      } else {
        user = req.session.user
      }
      
      whisk.context.log('info', 'HelloWorld web request by User ID=' + req.session.user.id + ', will use ws-' + ws_nid + '.'); 
     
      // start the session sync on the web-side, will be completed on the websockets-side
      // get the whisk session sync token for use in the view function
      // NOTE: session id and user id are required attributes
      whisk.Auth.start_ws_session_sync({
        sid: whisk.Auth.get_sid_from_web_req_cookies(req.cookies), 
        user_id: user.id                                            
      }, function(ws_token, err) {

        // render the template with the user    
        res.send(render_html({ user_id: user.id, ws_token: ws_token, ws_port: ws_port, ws_nid: ws_nid }));

      });

    });

    // reset user
    app.get('/reset', function (req, res) {
      whisk.context.log('info', 'HelloWorld reset session by User ID=' + req.session.user.id + '.'); 
      req.session.destroy(function() {});
      delete req.sessionID;
      res.redirect('/'); 
    });
 
  }
});


