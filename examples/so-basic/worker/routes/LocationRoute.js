
/*

  Location Worker Routes

  Handles location.* messages coming in from other parts of the so-basic system.

*/

// external interface
var Route = module.exports = exports;

// private attributes
var context = undefined;
var Cipher = undefined;
var routes = {};

// init

Route.init = function (attr) {

 /* attrs:
      context
      cipher
  */

  context = attr.context;
  Cipher = attr.cipher;

  context.log('info', 'Worker.LocationRoute.init set up location data.', {});

  // listen on each of the routes  
  context.log('info', 'Worker.LocationRoute.init: load routes.', {});
  Cipher.onTransmit('location.enter', routes.enter);
  Cipher.onTransmit('location.chat', routes.chat);

}

/* 
  incoming routes
*/


// enter

routes.enter = function (origin, tenent, payload) {
  context.log('info', 'Worker.LocationRoute.enter user_id=' + payload.user_id + ' at location_id=' + payload.location_id);

  // find the user
  context.Models.User().read(payload.user_id, function (err, user) {
    
    if (user) {

      console.log('Worker.LocationRoute.chat sending message=' + payload.message + ' to user ' + user.id + ' in location id=' + payload.location_id);

      // broadcast the chat message, but to a specified user in the location
      Cipher.broadcast("location.add_user", {
        location_id: payload.location_id,
        user_id: payload.user_id,
      }, {ns: "ws"});
      
    }

  });

}
 

// chat

routes.chat = function (origin, tenent, payload) {
  context.log('info', 'Worker.LocationRoute.chat from user_id=' + payload.from_user_id + ' to location_id=' + payload.to_location_id);

  // find the from user
  context.Models.User().read(payload.from_user_id, function (err, from_user) {
    console.log('from_user id=' + from_user.id);

    // send to specified user in location
    if (payload.to_user_id) {

      // find the to user
      context.Models.User().read(payload.to_user_id, function (err, to_user) {

        if (to_user) {

          console.log('Worker.LocationRoute.chat sending message=' + payload.message + ' to user ' + to_user.id + ' in location id=' + payload.to_location_id);

          // broadcast the chat message, but to a specified user in the location
          Cipher.broadcast("location.add_chat", {
            to_location_id: payload.to_location_id,
            to_user_id: to_user.id,
            from_user_id: from_user.id,
            message: payload.message
          }, {ns: "ws"});
          
        } else {
          
          context.log('error', 'Worker.LocationRoute.chat user not found for to_user_id=' + payload.to_user_id);
          
        }

      }); // END find to_user
      

    // send to all users in location
    } else {

      console.log('Worker.LocationRoute.chat sending message=' + payload.message + ' to all users in location id=' + payload.to_location_id);

      // broadcast the chat message to all in the location
      Cipher.broadcast("location.add_chat", {
        to_location_id: payload.to_location_id,
        from_user_id: from_user.id,
        message: payload.message
      }, {ns: "ws"});

    }

  }); // END find from_user

}

