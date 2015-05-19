/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * MIT Licensed
*/

var Route = function(attr) {

  /* attrs:
      name
  */
  
	if(!(this.name = attr.name)) {
		throw Error("Route was not given a name!");
	}

	this.methods = {};
}

Route.prototype.get_method_table = function()
{
	return this.methods;
}

Route.prototype.on = function(name, method)
{
	if(this.methods[name]) {
		throw Error("Route already has a method with that name!");
	} else {
		this.methods[name] = method;
	}
}

/* Not quite sure about using this yet
Route.prototype.use = function(name) 
{
	if(!this.methods[name]) {
		throw Error("No method with that name!");
	} else {
		return this.methods[name];
	}
}
*/

module.exports = exports = Route;
