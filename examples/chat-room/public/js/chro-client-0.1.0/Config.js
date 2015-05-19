/*

  Chat Room Config

*/


(function (chat_room) {
  var Config = (chat_room.Config = {});


  // config attributes
  Config.websocket = {};


  // load config

  Config.load_config = function (attr) {

    if (attr.websocket) Config.websocket = attr.websocket;

  }


}) (( window.CHRO=window.CHRO || {}));
