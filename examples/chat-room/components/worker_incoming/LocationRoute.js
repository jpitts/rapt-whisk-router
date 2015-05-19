
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
  Cipher.onTransmit('location.chat', routes.chat);
    
} 


/* 
  routes
*/


/* 
  routes
*/

routes.chat = function (origin, tenent, payload) {
  context.log('info', 'Worker.LocationRoute.chat from user_id=' + payload.from_user_id + ' to location_id=' + payload.to_location_id);

  // find the from user
  context.Models.User().read(payload.from_user_id, function (err, from_user) {
    console.log('from_user id=' + from_user.id);
 
    // find the location
    context.Models.Location().read(payload.to_location_id, function (err, loc) {
      
      if (loc) {
        
        // send to specified user in location
        if (payload.to_user_id) {

          // find the to user
          context.Models.User().read(payload.to_user_id, function (err, to_user) {

            if (to_user) {
              
              console.log('Worker.LocationRoute.chat sending message=' + payload.message + ' to user ' + to_user.id + ' in location id=' + loc.id);

              // broadcast the chat message to all in the location
              Cipher.broadcast("location.add_chat", {
                to_location_id: loc.id,
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
          
          console.log('Worker.LocationRoute.chat sending message=' + payload.message + ' to all users in location id=' + loc.id);

          // broadcast the chat message to all in the location
          Cipher.broadcast("location.add_chat", {
            to_location_id: loc.id,
            from_user_id: from_user.id,
            message: payload.message
          }, {ns: "ws"});
          
        }
 
      }

    }); // END find location

  }); // END find from_user
   
}
