/*!
 * Whisk Router
 * Copyright (c) 2012 Max Seiden
 * MIT Licensed
*/

// Node modules
var fs = require("fs");

// Whisk modules
var Route = require("./route")
	, Observer = require("./observer")
	, MethodWrapper = require("./method_wrapper")
	, ObserverWrapper = require("./observer_wrapper")

// This was recently a source of confusion, due to 
// the .bind(exports, ...) used at the bottom of the file.
// Low priority bug fix though. 
//module.exports = exports = new Router();

var Whisk;

/* 
  constructor
  
  attrs:
    whisk

*/

function Router (attr) {
  Whisk = attr.whisk;

	this.routes = {};
	this.observers = {};
}


// Creates a new route for use in the router file

Router.prototype.define_route = function(name) {
	if(this.routes[name]) {
		throw Error("Router already has a route with name '"+name+"'!");
	} else {
		return (this.routes[name] = new Route({ name: name }));
	}
}

// Creates a new observer for use in the router
// NOTE: the observer aspect is incomplete

Router.prototype.define_observer = function(name) {
	if(this.observers[name]) {
		throw Error("Router already has an observer with that name!");
	} else {
		return (this.observers[name] = new Observer(name));
	}
}

// Returns a route object for use in handlers/listeners/3rd party code
/*	Not quite sure how this is going to work out
Router.prototype.use_route = function(name)
{
	if(!this.routes[name]) {
		throw Error("No route with that name!");
	} else {
		return this.routes[name];
	}
}
*/

// Attaches all loaded routes to the the given Whisk Socket
// NOTE: the observer aspect is incomplete

Router.prototype.attach_routes_to_socket = function(socket)
{
	for(var route in this.routes) {
		var methods = this.routes[route].get_method_table();
		var observers = {};//this.observers[route].get_observation_table();
		for(var method in methods) {
			var path = [route, method].join(".")
				, method_obj = methods[method]
				, bound_wrapper = MethodWrapper.bind({}, Whisk, socket, method_obj, path)
				, obs;
			if(obs = observers[method]) {
				// If there are observers, execute them first 
				bound_wrapper = ObserverWrapper.bind({}, obs, socket, bound_wrapper, path);
			}
			socket.on(path, bound_wrapper);
			//console.log("Attached path: " + path);
		}
	}
}

var generic_module_loader = function(path, file_name_regex, attr) {

  /* attrs:
      context - contains config and winston logger
      whisk
  */

  //console.log('generic_module_loader path=' + path);
  var path_arr = path.split('/');

	fs.readdir(path, function(err, file_names) {
		if(err) {throw Error("Invalid module load directory! "+ err);}

		for(var idx = 0, len = file_names.length; idx < len; idx++) {
			if(file_name_regex.test(file_names[idx])) {
			  attr.context.log('info', "Whisk.router: Loading route module " + path_arr[path_arr.length-1] + '/' + file_names[idx]);
				require([path, file_names[idx]].join("/"));
			}
		}
	});
}

// load the incoming routes
Router.prototype.load_route_configs = function (attr) {
  /* attrs:
      context
      whisk
  */
  return generic_module_loader(attr.whisk.Config.get_routes_path(), /.+Route.js$/, attr);
}



// load the outgoing observers
Router.prototype.load_observer_configs = function (attr) {
  /* attrs:
      context
      whisk
  */
  return generic_module_loader(attr.whisk.Config.get_observers_path(), /.+Observer.js$/, attr);
}

module.exports = Router;

