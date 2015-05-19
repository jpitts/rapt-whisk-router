/*

  Chat Room Controller

*/


(function (chat_room) {
  var Ctrl = (chat_room.Controller = {});

  Ctrl.chats = [];


  // init - gets everything started

  Ctrl.init = function (attr, cb) {
    console.log('CHRO.init');

    /* attrs:
        config
          websocket - contains info about the websocket server - example: { port: 8080 }
        ws_token - used to authenticate the client
        user
          id
        location
          id
          title
          user_ids
    */

    // wait until the page is ready
    jQuery(document).ready(function() {

      // set up the client config
      CHRO.Config.load_config(attr.config);

      // set up the user
      CHRO.Model.load_user(attr.user);

      // initialize websockets
      CHRO.WebSocket.init(attr, function (err) {

        // relocate the user to their current location
        CHRO.Controller.relocate({ 
          location_id: attr['location'].id,
          location_title: attr['location'].title,
          location_user_ids: attr['location'].user_ids,
          user_id: attr['user'].id
        });

      });


      // UNTIL websockets active, room entered, auth confirmed
      //  THEN SET CHRO.room_ready
      var untilReadyCount = 0;
      async.until(
        // until test
        function () {
          return ( (Whisk.WebSocket.is_ready && CHRO.Model.current_location.is_loaded) || untilReadyCount > 5);
        },
        // on each test return false
        function (waitCb) {
          console.log('CHRO.init: untilReadyCount ' + untilReadyCount);
          untilReadyCount++;
          setTimeout(waitCb, 1000);
        },
        // on test return true
        function (err, results) {

          if (Whisk.WebSocket.is_ready && CHRO.Model.current_location.is_loaded) {
            console.log('CHRO.init: done waiting, room is ready');

          } else {
            console.log('CHRO.init: done waiting, room is not ready');

          }

        }
      ); // END UNTIL user enter room


    }); // END jquery ready

  }


  // send chat

  Ctrl.send_chat = function (attr) {

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
          from_user_id: CHRO.Model.user.id,
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
        from_user_id: CHRO.Model.user.id,
        to_location_id: attr.to_location_id,
        message: attr.message
      });

      jQuery('#chat-entry').val('');

    }


  }


  // add chat

  Ctrl.add_chat = function (attr) {

    /*
      from_user_id
      to_user_id
      to_location_id
      message
    */

    Ctrl.chats.push(attr);

    // safely reverse the chats
    chats = Array.prototype.slice.call(Ctrl.chats);
    chats.reverse();

    // create message text html from the chats
    message_text = '';
    for (var i=0; i<chats.length; i++) {

      // message addressed to a user
      if (chats[i].to_user_id) {

        if (CHRO.Model.user.id == chats[i].to_user_id) {
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


  // send relocate

  Ctrl.send_relocate = function (attr) {

    /* attrs:
        location_id
    */

    console.log('Controller.send_relocate');
    Whisk.WebSocket.sio.emit('world.relocate', {
      location_id: attr.location_id,
      user_id: CHRO.Model.user.id
    });

  }


  // relocate

  Ctrl.relocate = function (attr) {

    /* attrs:
        location_id
        location_title
        location_user_ids
        user_id
    */

    console.log('Controller.relocate to location_id=' + attr.location_id);

    // add images when ready to deploy, it helps with the overall vibe
    //jQuery('body').css("background", "url(/images/" + attr.location_id +"-background.jpg) no-repeat");

    jQuery('#location-container-title').html('Location: ' + attr.location_title);

    CHRO.Model.load_location({
      id: attr.location_id,
      user_ids: attr.location_user_ids,
    });
  }


  // add user to location

  Ctrl.add_user_to_location = function (attr) {
    console.log('Controller.add_user_to_location user_id=' + attr.user_id + ' to location_id=' + attr.location_id);

    /* attrs:
        location_id
        location_title
        location_user_ids
        user_id
    */

    // display notification
    var message;
    if (CHRO.Model.user.id == attr.user_id) {
      message = 'You relocated to the ' + attr.location_id + ' location!';
    } else {
      message = 'User ID=' + attr.user_id + ' relocated to the ' + attr.location_id + '!';
    }
    CHRO.Controller.display_user_notification({
      message: message
    });

    // this is the user relocating
    if (CHRO.Model.user.id == attr.user_id) {
      console.log('Controller.add_user_to_location relocating to location_id=' + attr.location_id);

      // user's location
      CHRO.Model.user.location_id = attr.location_id;

      // current location
      CHRO.Model.load_location({
        id: attr.location_id,
        title: attr.location_title,
        user_ids: attr.location_user_ids,
      });

      // clear out the chats
      Ctrl.chats = [];
      jQuery('#chat-messages').html('');

    // this is another user relocating to this room
    } else if (CHRO.Model.current_location.id == attr.location_id) {

      // current location
      CHRO.Model.load_location({
        user_ids: attr.location_user_ids,
      });

    // this is another user relocating to another room
    //  (i.e. remove user from the room)
    } else {

      // remove user id
      var index = CHRO.Model.current_location.user_ids.indexOf(attr.user_id);
      if (index > -1) {
        CHRO.Model.current_location.user_ids.splice(index, 1);
      }

    }

  }

  // display user notification

  Ctrl.display_user_notification = function (attr) {
    jQuery('#message').html(attr.message);
  }

  // display user status

  Ctrl.display_user_status = function (attr) {
    jQuery('#status').html(attr.message);
  }


}) (( window.CHRO=window.CHRO || {}));
