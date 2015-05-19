/*

  Chat Room WebSocket init and definition of routes

  Initializes Whisk.Websocket with routes
    base_routes - overloaded handlers and callbacks for base socket.io functions defined in Whisk.WebSockets
    whisk_routes - overloaded handlers and callbacks for those defined in Whisk.WebSockets
    app_routes - socket.io handlers for the Chat Room app
*/


(function (chat_room) {
  var WS = (chat_room.WebSocket = {});

  // init

  WS.init = function (attr, cb) {
    console.log('CHRO.WebSocket.init');

    /* attrs:
        config
          websocket
        ws_token - used to authenticate the client
    */

    if (!attr) { attr = {}; }
    

    // initialize the Whisk websockets client library 
    Whisk.WebSocket.init({
      config: attr.config,
      ws_token: attr.ws_token,
      routes: {
        base: WS.base_routes,
        whisk: WS.whisk_routes,
        app: WS.app_routes,
      }
    }, function () {

      CHRO.Controller.display_user_status({ message: 'Connection to Chat Room active.' });

      // final callback
      cb();
    });


  }; // END init


  /*
    base routes
      overloaded handlers and callbacks
  */

  WS.base_routes = {

    // disconnect

    'disconnect': {
      'cb': function (err) {
        CHRO.Controller.display_user_status({ message: 'Connection to Chat Room was lost!' });
      }
    },


    // reconnecting

    'reconnecting': {
      'cb': function (err) {
        CHRO.Controller.display_user_status({ message: 'Reconnecting to Chat Room...' });
      }
    },


    // reconnect

    'reconnect': {
      'cb': function (err) {
        CHRO.Controller.display_user_status({ message: 'Reconnected to Chat Room closed!' });
      }
    },


    // close

    'close': {
      'cb': function (err) {
        CHRO.Controller.display_user_status({ message: 'Connection to Chat Room closed!' });
      }
    },

  }; // END base routes definition


  /*
    whisk routes
      overloaded handlers and callbacks
  */

  WS.whisk_routes = {

    // auth request

    'whisk.auth.request': {
    },


    // auth error

    'whisk.auth.error': {
    },


    // auth accept

    'whisk.auth.accept': {
    },


  }; // END whisk routes definition


  /*
    application routes
      handelers for world, location, user
  */

  WS.app_routes = {


    /*
      world handlers
    */


    // world.add_user_to_location

    'world.add_user_to_location': {
      'handler': function (payload) {

        console.log('world.add_user_to_location', payload);

        // add the user
        CHRO.Controller.add_user_to_location(payload);
      }
    },


    /*
      location handlers
    */


    // location.add_chat

    'location.add_chat': {
      'handler': function (payload) {

        console.log('location.add_chat', payload);
        //console.log(' from sio id=', Whisk.WebSocket.sio.socket.sessionid);

        // add the user
        CHRO.Controller.add_chat(payload);
      }
    },




    /*
      user handlers
    */


    // user.relocate

    'user.relocate': {
      'handler': function (payload) {
        console.log('user.relocate', payload);

        if (payload.user_id == CHRO.Model.user.id) {

          // add the user
          CHRO.Controller.relocate(payload);

        }
      }
    },


  }; // END application routes definition


}) (( window.CHRO=window.CHRO || {}));
