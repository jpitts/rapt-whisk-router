
/*
  Session Data Model
*/

var Modelrizerly = require("rapt-modelrizerly");

/*
  model definition
*/

var Session = Modelrizerly.define_model("session", function() {

  var model = this;
  model.db_driver('redis');
  model.pk_name("sid");

  // identifying attributes
  this.string("sid");
  this.string("socket_id");
  this.string("user_id");
  
  this.object("ws_cipher_address");
  //this.object("web_cipher_address");
 
  // for use by the implementer
  this.object("store");
  
});


/*
  init - (fetch AND update a current session) OR start a new session
  
  attrs:
    whisk
    sid
    socket_id
    user_id
    ws_cipher_address
    web_session_id
*/

Session.prototype.init = function init (attr, cb) {
  this.whisk = attr.whisk;
  var context = this.whisk.context;
  context.log('info', 'Session.init');
  
  var new_sess = {
    sid: attr.sid,
    socket_id: attr.socket_id,
    user_id: attr.user_id ? attr.user_id : '',
    ws_cipher_address: attr.ws_cipher_address,
    web_session_id: attr.web_session_id ? attr.web_session_id : '',
    store: {}
  };
  
  // find session
  Modelrizerly.Session({ sid: attr.sid }).read(null, function(err, sess) {
    if (err) { console.error(err); cb(err); }
    
    // session exists
    if (! err && sess) {
      context.log('info', 'Session.init: session ' + sess.sid + ' exists.');

      // update session
      sess.update({ fields: ['socket_id', 'ws_cipher_address'] }, function(err, updated_sess) {
        if (err) { console.error(err); return cb(err); }
        return cb(err, updated_sess);
      }); // END session update

    } else {
      context.log('info', 'Session.init: create new session.');
 
      // create session
      Modelrizerly.Session(new_sess).create(function(err, created_sess) {
        if (err) { console.error(err); return cb(err); }
        return cb(err, created_sess);
      }); // END session create
     
    }

  }); // END session read


}

/*
  update store
  
  attrs:
    '$set' - only updates the values in this object
    
*/

Session.prototype.update_store = function update_store (attr, cb) {
  var sess = this;
  
  // fire and forget update
  if (!cb) { cb = function () {} }
  
  if (!attr) { 
    var err = 'Cannot update store with nothing.';
    console.error(err); return cb(err); 
  }

  if (!sess || !sess.sid)  {
    var err = 'Cannot update store in an empty session.';
    console.error(err); return cb(err); 
  }
  
  // update store with what is in '$set'
  var update = attr['$set'];
  for (var key in update) {
    if (update.hasOwnProperty(key)) {
      sess.store[key] = update[key];
    }
  }

  // update session
  sess.update({ fields: ['store'] }, function(err, updated_sess) {
    if (err) { console.error(err); return cb(err); }
    // only call back with the store data
    return cb(err, updated_sess.store);
  }); // END session update

}




