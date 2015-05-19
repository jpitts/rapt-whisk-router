/*

  Chat Room Controller

*/


(function (so_basic) {

  so_basic.chats = [];
  so_basic.user = {};

  // init - gets everything started

  so_basic.init = function (attr, cb) {
    console.log('SOBA.init');

    /* attrs:
        config
          websocket - contains info about the websocket server - example: { port: 8080 }
        ws_token - used to authenticate the client
        user
          id
          location_id
    */

    // wait until the page is ready
    jQuery(document).ready(function() {

      // set the user and location
      SOBA['user'] = attr['user'];

      // initialize the Whisk websockets client library 
      Whisk.WebSocket.init({
        config: {
          websocket: { port: attr.config.websocket.port }
        },
        ws_token: attr.ws_token,
        routes: {
          base: SOBA.whisk_ws_routes.base,
          whisk: SOBA.whisk_ws_routes.whisk,
          app: SOBA.whisk_ws_routes.app,
        }
      }, function () {

        console.log('Whisk is connected!');
        SOBA.display_user_status({ message: 'Connection to So Basic active.' });
  
      });


      // UNTIL websockets active, room entered, auth confirmed
      var untilReadyCount = 0;
      async.until(

        // test function
        function () {return ( (Whisk.WebSocket.is_ready && Whisk.WebSocket.auth_accepted) || untilReadyCount > 10);},

        // called on each test
        function (waitCb) {
          untilReadyCount++; setTimeout(waitCb, 250);
        },
        
        // called on test function returns true
        function (err, results) {
          if (Whisk.WebSocket.is_ready && Whisk.WebSocket.auth_accepted) {
            console.log('SOBA.init: room is so ready');
          } else { 
            console.log('SOBA.init: room is so not ready');
          }

        }
      ); // END UNTIL user enter room


    }); // END jquery ready

  }

  // whisk websocket routes
  
  SOBA.whisk_ws_routes = {
    base: {},
    whisk: {},
    app: {
      'location.add_chat': {
        'handler': function (payload) {
          console.log('whisk_ws_routes.app: received location.add_chat: ', payload);
          SOBA.add_chat(payload);
        }
      },
      'location.add_user': {
        'handler': function (payload) {
          console.log('whisk_ws_routes.app: received location.add_user: ', payload);
          SOBA.add_user(payload);
        }
      },
    }
  };
  

  // send chat

  SOBA.send_chat = function (attr) {

    /* attrs:
        from_user_id
        to_location_id
        message
    */

    console.log('Controller.send_chat to location=' + attr.location_id + ' message=' + attr.message);

    // regex: message to a specific user in the location
    var re = /\@(\w+)\:/;
    if (attr.message.match(re)) {
      console.log('Controller.send_chat: message appears to contain an addressee.');

      // regex: validate message addressee
      var re = /^\@(\w+)\:/;
      if (attr.message.match(re)) {

        // regex: isolate the message
        var re = /^\@(\w+)\:(\s{0,})(\w+)/;
        var modified_message = attr.message;
        modified_message = modified_message.replace(re, "$3");

        // split: isolate the user_id
        var split_message = attr.message.split(/[\@\:]/);
        var to_user_id = split_message[1];

        console.log('Controller.send_chat: addressee ' + to_user_id + ' properly set!');

        Whisk.WebSocket.sio.emit('location.chat', {
          to_user_id: to_user_id,
          from_user_id: SOBA.user.id,
          to_location_id: attr.to_location_id,
          message: modified_message
        });
        
        jQuery('#chat-entry').val('');

      } else {
        window.setTimeout(function () {jQuery('#chat-notification').html('');}, 5000);
        jQuery('#chat-notification').html('Message not sent! Your message must begin with the user addressing.');
        jQuery('#chat-entry').val('');

      }

    // message to all in the location
    } else {

      Whisk.WebSocket.sio.emit('location.chat', {
        from_user_id: SOBA.user.id,
        to_location_id: attr.to_location_id,
        message: attr.message
      });

      jQuery('#chat-entry').val('');

    }


  }


  // add chat

  SOBA.add_chat = function (attr) {

    /*
      from_user_id
      to_user_id
      to_location_id
      message
    */

    SOBA.chats.push(attr);

    // safely reverse the chats
    chats = Array.prototype.slice.call(SOBA.chats);
    chats.reverse();

    // create message text html from the chats
    message_text = '';
    for (var i=0; i<chats.length; i++) {

      // message addressed to a user
      if (chats[i].to_user_id) {

        if (SOBA.user.id == chats[i].to_user_id) {
          message_text = message_text + '<p>' + chats[i].from_user_id + ': (private) ' + chats[i].message + '</p>';

        } else {
          message_text = message_text + '<p>' + chats[i].from_user_id + ': (private) ' + chats[i].message + '</p>';

        }

      // message to all users in the location
      } else {
        message_text = message_text + '<p>' + chats[i].from_user_id + ': ' + chats[i].message + '</p>';
      }
    }

    //console.log('chats: ', chats);
    //console.log('message text: ' + message_text);

    jQuery('#chat-messages').html(message_text);

  }


  // add user

  SOBA.add_user = function (attr) {

    /*
      user_id
    */
   
    // display notification
    var message;
    if (SOBA.user.id == attr.user_id) {
      message = 'You entered the room!!';
    } else {
      message = 'User ID=' + attr.user_id + ' entered the room!';
    }
    SOBA.display_user_notification({
      message: message
    });
 
  }


  // display user notification

  SOBA.display_user_notification = function (attr) {
    jQuery('#message').html(attr.message);
  }


  // display user status

  SOBA.display_user_status = function (attr) {
    jQuery('#status').html(attr.message);
  }


}) (( window.SOBA=window.SOBA || {}));
