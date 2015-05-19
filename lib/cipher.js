
var API = module.exports = exports;

// Module Imports
////////////////////////////////////////////////////////////////////////////////

// Cipher module - allows for address based message routing with redis
// SEE: https://github.com/jpitts/rapt-cipher

var Cipher = API.Cipher = require('rapt-cipher');

var CipherInstance = API.CipherInstance = undefined; // will be set in the init/run function


// defaults

var Whisk = undefined;
var context = undefined;


// init

API.init = function (attr) {

  /* attrs:
      whisk
      context - contains config and logger
      redis
        port
        host
        options
      cipher
        namespace
        nid
      tenent_handler
  */ 
  
  Whisk = attr.whisk;
  context = attr.context;
 
  context.log('info', 'Whisk.Cipher initialization.');

  // fire up cipher
  Cipher.init({
    namespace: attr.cipher.namespace,
    nid: attr.cipher.nid,
    redis: attr.redis,
    logger: attr.logger,
    log: attr.log,
  });

  // get the instance based on the cipher config
  API.instance = API.Cipher.getInstance(attr.cipher);
  Whisk.Config.cipher_instance(API.instance); // for consistency

  // define the cipher tenent handler
  API.instance.tenentHandler = attr.tenent_handler ? attr.tenent_handler : API.tenent_handler;

  return API;
}


// convenient access to the whisk server's cipher instance

API.getInstance = function getInstance () { return API.instance; }


// tenent_handler
// called each time a message is received, this retrieves the websocket 
//  connection from the recipient.tid

API.tenent_handler = function tenentHandler (recipient, cb) {
  
  /*
  console.log('Whisk.CipherInstance.tenentHandler recipient: ', recipient);
  console.log('socket found with tid= ' + recipient.tid + ': ', 
      typeof API.Config.io_instance().sockets.socket(recipient.tid));

  console.log('clients array test');
  var clients = API.Config.io_instance().sockets.clients();
  for (var i=0; i<clients.length; i++) {
    var client = clients[i];
    console.log(' client id=' + client.id + ' store id=' + client.store.id);
  }
  console.log('end clients array test');

  */
  
  if (recipient && recipient.tid) {        
    cb(null, Whisk.Config.io_instance().sockets.socket(recipient.tid));
  
  } else {
    cb(null, recipient);
  
  }
  
}




