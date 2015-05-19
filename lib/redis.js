// Module Imports
////////////////////////////////////////////////////////////////////////////////
var API = module.exports = exports
  , redis_m = require("redis")
  , redis_c = undefined // client
  , redis_p = undefined // pub
  , redis_s = undefined // sub
;

// defaults

var Whisk;
var context;

var session_secret = "%g43v#kw4&5gdATW$sehAT$w6";
var session_key = "ss";
var session_prefix = "uid::";

var _redis_err = function _redis_err(e) {console.log("Redis Error!", e);}
var _redis_ready = function _redis_ready() {
  //console.log("Redis is ready!");
}

// init

API.init = function (cfg_data) {
  /* attrs:
      whisk
      context - contains config and logger
      redis
        port
        host
        options
  */ 
  
  Whisk = cfg_data.whisk;
  context = cfg_data.context;
 
  context.log('info', 'Whisk.Redis initialization.');

  redis_c = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)
  redis_p = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)
  redis_s = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)

  redis_c.on("error", _redis_err);
  redis_p.on("error", _redis_err);
  redis_s.on("error", _redis_err);

  redis_c.on("ready", _redis_ready);
  redis_p.on("ready", _redis_ready);
  redis_s.on("ready", _redis_ready);
 
  return API;
}

API.redis_client = function() {return redis_c;}
API.redis_pub = function() {return redis_p;}
API.redis_sub = function() {return redis_s;}

// Redis session config
API.session = {
    secret: function() {return session_secret;}
  , key: function() {return session_key;}
  , prefix: function() {return session_prefix;}
};

API.create_redis_client = function create_redis_client(port, host, options) {
  return redis_m.createClient(port, host, options);
}


