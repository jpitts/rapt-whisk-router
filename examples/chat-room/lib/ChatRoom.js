/* 
  node module dependencies
*/

var Modelrizerly = require("rapt-modelrizerly")
  , ModelLoader = require("../models/bootloader")
  , winston = require('winston')
  ;

/*
  Chat Room node module
*/

var CHRO = module.exports = exports;


/*
  private attributes
*/



/*
  public attributes
*/

CHRO.config = {};

CHRO.logger = new (winston.Logger) ({ });
CHRO.logger.add(winston.transports.Console);

CHRO.Models = undefined; // modelrizerly instance will be set later on in init

/* 
  public functions 
*/


// init

CHRO.init = function (attr, cb) {

  /* attrs: (default context)
      config
      Models
  */
  
  // default attr is empty
  attr = attr ? attr : {};
 
  // config
  if (attr.config) {
    CHRO.config = attr.config;

  } else {

    // set up the environment-based config
    try {
      require.resolve('../config/' + global.process.env.NODE_ENV);
      CHRO.config = require('../config/' + global.process.env.NODE_ENV).config;

    } catch (e) {
      CHRO.log('info', 'Service will use the default config: config/environment.js.default');

      // fall back to the default config
      try {
        require.resolve('../config/environment.js.default');
        CHRO.config = require('../config/environment.js.default').config;
   
      } catch (e) {
        console.error('cannot load config/environment.js.default');
        process.exit(e.code);
      }
    
    } 

  }

  // models
  if (attr.Models) {
    CHRO.Models = attr.Models;

  } else {
    CHRO.Models = Modelrizerly.init({ context: CHRO });

  }

  // done!
  cb(null, CHRO);

}


// log

CHRO.log = function log (level, message, attr) {
  if (!attr) { attr={} }
  CHRO.logger.log(level, message, attr);
}



