var Modelrizerly = require("rapt-modelrizerly")
  
var Location = Modelrizerly.define_model("location", function() {

  var model = this;
  model.db_driver('redis');
  model.pk_name("id");

  // attributes
  this.string("id");
  this.string("title");
  this.array("user_ids");

});
