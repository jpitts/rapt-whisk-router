(function (hello_world) {
  hello_world.user = {};

  // init - gets everything started, called from within a script tag in the HTML

  hello_world.init = function (attr, cb) {
    /* attrs:
        user_id
        ws_token - used in the web-ws session sync
        ws_port - websockets on a different port than web
        ws_nid - node id
    */


    // wait until the page is ready
    jQuery(document).ready(function() {

      // set the user, ws_token, ws_port
      hello_world.user.id = attr.user_id;
      
      // place cursor on the say form
      jQuery('#say-form input[type=text]').focus();
      
      // capture returns on the say form
      jQuery('#say-form input[type=text]').keypress(function (e) {
        if (e.which == 13) { hello_world.say_it(); return false; }
      });

      // initialize the Whisk websockets client library 
      // NOTE: whisk will complete the web-ws session sync using the ws_token
      Whisk.WebSocket.init({
        config: { websocket: { port: attr.ws_port } },
        ws_token: attr.ws_token,
        routes: {
          base: {},
          whisk: {},
          app: {
            'world.reply': {
              'handler': function (payload) { 
                jQuery("#say-form input[type=text]").val(''); // clear the value
                jQuery("#world-reply").html(payload.message);
              }
            },
          },
        }
      }, function () {
        console.log('Hello World Client: Whisk is connected!');
        jQuery('#world-notice').html('Connected to ws-' + attr.ws_nid);
      });

    });

  }
  
  // say it
  
  hello_world.say_it = function (attr) {
    console.log('HelloWorld.say_it: ', attr);
    Whisk.WebSocket.sio.emit('world.say', {
      message: jQuery("#say-form input[type=text]").val()
    });
  }

}) (( window.HelloWorldClient=window.HelloWorldClient || {}));
