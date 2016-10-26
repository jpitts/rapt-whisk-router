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

var default_cfg = {
  session: {
    secret: 'quiveringwhiskers',
    key: 'whisk-user',
    prefix: 'uid::'
  }
};
var cfg = undefined;

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
      session
        secret
        key
        prefix
  */ 
  
  Whisk = cfg_data.whisk;
  context = cfg_data.context;
 
  context.log('info', 'Whisk.Redis initialization.');
  //console.log(cfg_data.session);

  redis_c = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)
  redis_p = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)
  redis_s = redis_m.createClient(cfg_data.redis.port, cfg_data.redis.host, cfg_data.redis.options)

  redis_c.on("error", _redis_err);
  redis_p.on("error", _redis_err);
  redis_s.on("error", _redis_err);

  redis_c.on("ready", _redis_ready);
  redis_p.on("ready", _redis_ready);
  redis_s.on("ready", _redis_ready);

  cfg = {
    session: {
      secret: (cfg_data.session && cfg_data.session.secret) ? cfg_data.session.secret : default_cfg.session.secret,
      key: (cfg_data.session && cfg_data.session.key) ? cfg_data.session.key : default_cfg.session.key,
      prefix: (cfg_data.session && cfg_data.session.prefix) ? cfg_data.session.prefix : default_cfg.session.prefix
    }
  };
  
  return API;
}

API.redis_client = function() {return redis_c;}
API.redis_pub = function() {return redis_p;}
API.redis_sub = function() {return redis_s;}

// session config functions

API.session = {
    secret: function() {
      //console.log('session.secret=' + cfg.session.secret); 
      return cfg.session.secret;
    }
  , key: function() { 
      //console.log('session.key=' + cfg.session.key); 
      return cfg.session.key;
    }
  , prefix: function() {
      //console.log('session.prefix=' + cfg.session.prefix); 
      return cfg.session.prefix;
    }
};

API.create_redis_client = function create_redis_client(port, host, options) {
  return redis_m.createClient(port, host, options);
}


