var Modelrizerly = require("rapt-modelrizerly")
  
var User = Modelrizerly.define_model("user", function() {

  var model = this;
  model.db_driver('redis');
  model.pk_name("id");

  // attributes
  this.string("id");
  this.string("name");
  this.string("location_id");

  /* 
    cipher_address
      ns - cipher namespace
      nid - cipher nid
      tid - whisk sid / websocket id
  */
  this.object("cipher_address");


});


// set cipher address

User.prototype.set_cipher_address = function set_cipher_address (attr, cb)  {

  /* attrs:
      ns - cipher namespace
      nid - cipher nid
      tid - whisk sid / websocket id
  */
  
  var user = this;
  
  console.log('User.set_cipher_address for user=' + user.id + ' addr=', attr);
  
  user.cipher_address = { ns: attr.ns, nid: attr.nid, tid: attr.tid };
  
  user.update({fields: ["cipher_address"]}, function(err) {
    if (err) { console.error(err); cb(err); }
    console.log('User.set_cipher_address: cipher_address updated for user=' + user.id);
    cb(err);
  });


}

