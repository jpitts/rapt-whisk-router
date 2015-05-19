/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * Currently maintained by Jamie Pitts
 * MIT Licensed
*/

//module.exports = exports = new Config();

var Config = module.exports = exports;

Config.init = function init (params) {
  params.context.log('info', 'Whisk.Config.init'); 

	// Server configs
	this.websocket_port = 8421; // TODO: deprecate this?
	this.http_port = 8421;      // TODO: deprecate this?
	this.redis_config = {};

  // whisk module path
  var whisk_path_array = __dirname.split("/");
  whisk_path_array.pop();
  this.whisk_path = whisk_path_array.join('/');

	// Routing configs
	this.routes_path = "./" + (params.websocket_routes_path || 'routes');
	this.observers_path = "./" + (params.websocket_observers_path || 'observers');
	this.base_path = params.base_path || (function() {
		var cursor = module
		while(cursor.id !== ".") 
		{cursor = cursor.parent;}
		return cursor.filename.replace(/\/\w+.js$/, "");
	})();
  
  params.context.log('info', 'Whisk.Config.init set routes_path=' + this.get_routes_path()); 
  params.context.log('info', 'Whisk.Config.init set observers_path=' + this.get_observers_path()); 
  params.context.log('info', 'Whisk.Config.init set base_path=' + this.get_base_path()); 
  

  //console.log('BASE PATH ' + this.base_path);

	// Object to hold singletons
	this.singletons = {};

	// Loading in custom params
	for(var idx in params) {
		if(this[idx]) {
			this[idx] = params[idx];
		}
	}

}

// 'Singleton' setters for db and 3rd party module access
var handle_singleton = function(name, instance_)
{
	if(instance_) {
		this.singletons[name] = instance_;
	} else if(!this.singletons[name]) {
		throw Error("No instance of '"+name+"' present!");
	}
	return this.singletons[name];
}

// cipher instance

Config.cipher_instance = function(instance) 
{
	return handle_singleton.call(this, "cipher", instance);
}

// redis singleton

Config.redis_instance = function(instance) 
{
	return handle_singleton.call(this, "redis", instance);
}

// socket.io singleton

Config.io_instance = function(instance)
{
	return handle_singleton.call(this, "socketio", instance);
}

// express singleton

Config.express_instance = function(instance)
{
	return handle_singleton.call(this, "express", instance);
}

// Dynamically build paths on function call
Config.prepend_base_path = function(path) {
	if(!this.base_path) {throw Error("No base path set!");}
  //console.log('prepend_base_path');
  //console.log(' base_path=' + this.base_path);
  //console.log(' path=' + path);
  return [this.base_path, path].join("/");
}

Config.get_whisk_path = function () {
  return this.whisk_path;
}

Config.get_base_path = function () {
  return this.base_path; 
}

Config.get_routes_path = function () {
  return this.prepend_base_path(this.routes_path);
}

Config.get_observers_path = function () {
  return this.prepend_base_path(this.observers_path);
}

