/*

  Chat Room Model


*/


(function (chat_room) {
  var Model = (chat_room.Model = {});

  /*
    attributes
  */

  Model.user = {
    is_loaded: false,
    id: undefined,
    location_id: undefined
  };

  Model.current_location = {
    is_loaded: false,
    id: undefined,
    user_ids: [],
  };


  /*
    location functions
  */


  // load location

  Model.load_location = function (current_location) {

    /* attrs:
        id
        user_ids
    */


    if (current_location.user_ids) {
      console.log('Model.load_location user_ids', current_location.user_ids);
      Model.current_location.user_ids = current_location.user_ids;
    }

    if (current_location.id) {
      console.log('Model.load_location id=' + current_location.id);
      Model.current_location.id = current_location.id;
    }

    // location model is loaded
    Model.current_location.is_loaded = true;

  }




  /*
    user functions
  */


  // load user

  Model.load_user = function (user) {

    /* attrs:
        id
    */

    console.log('Model.load_user ', user);


    Model.user.id = user.id;

    // user model is loaded
    Model.user.is_loaded = true;

  }



}) (( window.CHRO=window.CHRO || {}));
