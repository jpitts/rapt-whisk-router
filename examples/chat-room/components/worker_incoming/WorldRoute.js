
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

  context.log('info', 'Worker.WorldRoute.init set up location data.', {});  

  // locations needing to be added
  var locations_to_add = [];

  // set up the default locations from the config file
  context.Models.Location().find({}, {}, function (err, locs) {
    if (locs && locs[0]) {
      context.log('info', 'Worker.WorldRoute.init locations already added, now verifying...', {}); 
      
      // create hash of already loaded locations by id
      var locs_hash = {};
      locs.map(function (loc) { locs_hash[loc.id] = loc; });

      // load up on locations in the config but not stored in the data model
      for (var i=0; i<context.config.data.locations.length; i++) {
        var loc = context.config.data.locations[i];
        if (!locs_hash[loc.id]) locations_to_add.push(loc); 
      }

      context.log('info', 'Worker.WorldRoute.init will create ' +  locations_to_add.length + ' additional locations.', {}); 

    } else {
      context.log('info', 'Worker.WorldRoute.init create ' + context.config.data.locations.length + ' new locations.', {}); 
      
      for (var i=0; i<context.config.data.locations.length; i++) {
        locations_to_add.push(context.config.data.locations[i]);
      }
    }

    // add new locations
    for (var i=0; i<locations_to_add.length; i++) {
      context.Models.Location(locations_to_add[i]).create(function(err, created_loc) {
        context.log('info', 'Worker.WorldRoute.init created location id=' + created_loc.id + '.', {}); 
      });
    }

  });

  // listen on each of the routes  
  context.log('info', 'Worker.WorldRoute.init: load routes.', {}); 
  Cipher.onTransmit('world.relocate', routes.relocate);
    
} 


/* 
  routes
*/

routes.relocate = function (origin, tenent, payload) {
  context.log('info', 'Worker.WorldRoute.relocate user_id=' + payload.user_id + ' to location_id=' + payload.location_id);

  // find the user
  context.Models.User().read(payload.user_id, function (err, user) {
    console.log('user id=' + user.id);
 
    // find the location
    context.Models.Location().read(payload.location_id, function (err, loc) {
      console.log('location id=' + loc.id);
      console.log(loc.user_ids.indexOf(payload.user_id));
      //console.log(loc.user_ids);

      if (loc) {
         
        // push user_id into the location
        if (loc.user_ids.indexOf(payload.user_id)<0) {
          context.log('info', 'Worker.WorldRoute.relocate push user_id=' + payload.user_id + ' into user_ids in location_id=' + payload.location_id);
          
          loc.user_ids.push(payload.user_id);
          loc.update({fields: ["user_ids"]}, function(err) {
            if (err) { console.err(err); }
            
            Cipher.broadcast("world.add_user_to_location", {
              location_id: payload.location_id,
              location_title: loc.title,
              location_user_ids: loc.user_ids,
              user_id: payload.user_id,
              user_cipher_address: user.cipher_address,
            }, {ns: "ws"}) 

          });

        } 
          
        // update the user to be in location
        if (user.location_id != payload.location_id) {
          context.log('info', 'Worker.WorldRoute.relocate update user id=' + payload.user_id + ' with location_id=' + payload.location_id);

          // get the location of the room the user is leaving
          context.Models.Location().read(user.location_id, function (err, leaving_loc) {
            if (leaving_loc && leaving_loc.user_ids && leaving_loc.user_ids[0]) {
              context.log('info', 'Worker.WorldRoute.relocate user id=' + payload.user_id + ' leaving location_id=' + leaving_loc.id);

              leaving_loc.user_ids.splice(1, leaving_loc.user_ids.indexOf(payload.user_id));
              console.log('new user_ids for this location ', leaving_loc.user_ids);
              leaving_loc.update({fields: ["user_ids"]}, function(err) {
                if (err) { console.err(err); }
                
                Cipher.broadcast("world.remove_user_from_location", {
                  location_id: leaving_loc.id,
                  location_title: leaving_loc.title,
                  location_user_ids: leaving_loc.user_ids,
                  user_id: payload.user_id,
                  user_cipher_address: user.cipher_address,
                }, {ns: "ws"});

              });
            }
          });

          user.location_id = payload.location_id;
          user.update({fields: ["location_id"]}, function(err) {
            if (err) { console.err(err); }
            
            //console.log('cipher address ', user.cipher_address);

            Cipher.transmit("user.relocate", 
              { 
                location_id: payload.location_id, 
                location_title: loc.title,
                user_id: payload.user_id 
              }, 
              user.cipher_address,
              user.cipher_address.tid
            );
            
          });
        }
      
      } else {
        context.log('error', 'Worker.WorldRoute.relocate user_id=' + payload.user_id + ' to location_id=' + payload.location_id + ' failed because location could not be found!');

      }

    }); // END read location
    
  }); // END read user
 
}




