
/*
  node modules
*/

var http = require("http")
  , httpProxy = require("http-proxy")
  , whisk = require("../../../")
  , cipher = require('rapt-cipher')
  , chatRoom = require('../lib/ChatRoom')
;


/*
  proxy service module  
*/

var Proxy = module.exports = exports;


// initialize

Proxy.init = function (attr) {

  /* attrs:
      CIPHER_NS
      CIPHER_NID
      context
  */

  // initialize the context (may have already been initialized)
  chatRoom.init(attr.context, function (err, CHRO) {

    CHRO.log('info', 'Proxy Service ' + attr.CIPHER_NS + '.' + attr.CIPHER_NID + ' init.');

    /*
      configuration
      NOTE: to load environment-based config, set NODE_ENV=dev in the shell script call
    */
    
    var service_cfg = CHRO.config;
    
    var web_node_count = service_cfg.web.nodes.length;
    var web_nodes = service_cfg.web.nodes.slice(0,web_node_count);
    CHRO.log('info', 'Proxy: configuring proxy for ' + web_node_count + ' web nodes.');

    var websocket_node_count = service_cfg.websocket.nodes.length;
    var websocket_nodes = service_cfg.websocket.nodes.slice(0, websocket_node_count);
    CHRO.log('info', 'Proxy: configuring proxy for ' + websocket_node_count + ' websocket nodes.');


    /*
      SEE: https://github.com/nodejitsu/node-http-proxy
    */  
   

    // set up the web nodes
    for (var n=0; n<web_node_count; n++) {
      CHRO.log('info', 'Proxy: create proxy for web' + n + ' on ' + service_cfg.web.nodes[n].host + ':' + service_cfg.web.nodes[n].port + '.');
   
      // web proxy on this node
      service_cfg.web.nodes[n].proxy = httpProxy.createProxyServer({ 
        target: {
          host: service_cfg.web.nodes[n].host, 
          port: service_cfg.web.nodes[n].port 
        }
      });

      // set other attributes
      service_cfg.web.nodes[n].is_down = false;

    }
    

    // set up the websocket nodes
    for (var n=0; n<websocket_node_count; n++) {
      CHRO.log('info', 'Proxy: create proxy for ws' + n + ' on ' + service_cfg.websocket.nodes[n].host + ':' + service_cfg.websocket.nodes[n].port + '.');
   
      // web proxy on this node
      service_cfg.websocket.nodes[n].proxy = httpProxy.createProxyServer({ 
        target: {
          host: service_cfg.websocket.nodes[n].host, 
          port: service_cfg.websocket.nodes[n].port 
        }
      });

      // set other attributes
      service_cfg.websocket.nodes[n].is_down = false;

    }


    // fire up the main server
    var server = http.createServer(function(req, res) {  
    
      // handle a new incoming request

      switch (true) {

        // websocket requests
        case (/^\/socket.io\/(.*)/.test(req.url)):
          //console.log('websocket request to ' + req.url);

          // determine the node id
          var nid = select_server_nid({
            req:req, res:res, 
            context:CHRO,
            server_type: 'ws',
            nodes: websocket_nodes
          });
          
          CHRO.log('info', 'Proxy websocket req for ' + req.url + ' to nid=' + nid + ' / port=' + service_cfg.websocket.nodes[nid].port);
          
          // proxy the ws request
          service_cfg.websocket.nodes[nid].proxy.web(req, res); 
       
          // error handling 
          service_cfg.websocket.nodes[nid].proxy.on('error', function (err, req, res) {
            CHRO.log('error', 'Proxy error: ' + err);
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Something went wrong. ' + err);
          });

          // observe everything
          service_cfg.websocket.nodes[nid].proxy.on('proxyRes', function (proxyRes, req, res) {
            //console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
          });

          break;


        // web requests
        default: 
          //console.log('web request to ' + req.url);

          // determine the node id
          var nid = select_server_nid({
            req:req, res:res, 
            context:CHRO,
            server_type: 'web',
            nodes: web_nodes
          });
          
          CHRO.log('info', 'Proxy web req for ' + req.url + ' to nid=' + nid + ' / port=' + service_cfg.web.nodes[nid].port);
          
          // proxy the web request
          service_cfg.web.nodes[nid].proxy.web(req, res); 
          
          // error handling 
          service_cfg.web.nodes[nid].proxy.on('error', function (err, req, res) {
            CHRO.log('error', 'Proxy error: ' + err);
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Something went wrong. ' + err);
          });

          // observe everything
          service_cfg.web.nodes[nid].proxy.on('proxyRes', function (proxyRes, req, res) {
            //console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
          });


          break;

      }



    });
   


    // handle websocket upgrades
    server.on('upgrade', function (req, socket, head) {

      // determine the node id
      var nid = select_server_nid({
        req:req, // NOTE: no res as the cookie has already been stored
        context:CHRO,
        server_type: 'ws',
        nodes: websocket_nodes
      });
      
      CHRO.log('info', 'Proxy: upgrade ws req for ' + req.url + ' to nid=' + nid + ' / port=' + service_cfg.websocket.nodes[nid].port);

      // proxy the upgrade request
      service_cfg.websocket.nodes[nid].proxy.ws(req, socket, head);
      
      // error handling 
      service_cfg.websocket.nodes[nid].proxy.on('error', function (err, req, res) {
        CHRO.log('error', 'Proxy error: ' + err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Something went wrong. ' + err);
      });

      // observe everything
      service_cfg.websocket.nodes[nid].proxy.on('proxyRes', function (proxyRes, req, res) {
        //console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
      });

    });



    CHRO.log('info', 'Proxy: start listening for requests on port=' + service_cfg.web.port);
    server.listen(service_cfg.web.port);


  }); // END CHRO.init
 
} // END Proxy.init


// select server nid
// used to determine if a client is already attached to a node (via cookies for web_nid and ws_nid)
// SOURCE: http://goldfirestudios.com/blog/136/Horizontally-Scaling-Node.js-and-WebSockets-with-Redis

var select_server_nid = function(attr) {

  /* attrs:
      context
      req
      res
      server_type - web or ws
      nodes
  */

  var CHRO = attr.context;  
  var req = attr.req;
  var res = attr.res;
  var server_type = attr.server_type;
  var nodes = attr.nodes;
  
  //CHRO.log('info', 'Proxy.select_server_nid for server_type=' + server_type + ' with node count ' + nodes.length);
  //console.log(req.headers.cookie);

  var index = -1;
  var i = 0;
 
  // Check if there are any cookies.
  var has_cookie = false;
  if (req.headers && req.headers.cookie && req.headers.cookie.length > 1) {
    var cookies = req.headers.cookie.split('; ');
 
    for (i=0; i<cookies.length; i++) {
      if (cookies[i].indexOf(server_type + '_nid=') === 0) {
        var position = (server_type + '_nid=').length;
        var value = cookies[i].substring(position, cookies[i].length);
        if (value && value !== '') {
          index = value;
          has_cookie = true;
          break;
        }
      }
    }
  }
  
  //CHRO.log('info', 'Proxy.select_server_nid: has_cookie=' + has_cookie + ' index=' + index);
  

  // Select a random server if they don't have a sticky session.
  if (index < 0 || !nodes[index]) {
    index = Math.floor(Math.random() * nodes.length);
  }
 
  // If the selected server is down, select one that isn't down.
  if (nodes[index].is_down) {
    index = -1;
 
    var tries = 0;
    while (tries < 5 && index < 0) {
      var randIndex = Math.floor(Math.random() * nodes.length);
      if (!nodes[randIndex].is_down) {
        index = randIndex;
      }
 
      tries++;
    }
  }
 
  index = index >= 0 ? index : 0;
 
  // Store the server index as a sticky session.
  if (res && !has_cookie) {
    //CHRO.log('info', 'Proxy.select_server_nid: Set-Cookie', server_type + '_nid=' + index + '; path=/');
    res.setHeader('Set-Cookie', server_type + '_nid=' + index + '; path=/');
  }
  
  //CHRO.log('info', 'Proxy.select_server_nid: final selection index=' + index);
 
  return index;
};


/* 
  start this proxy up 
    (if it is running in standalone mode)
*/

if (process.env.CHRO_STANDALONE) {

  // proxy
  Proxy.init({
    CIPHER_NS: process.env.CIPHER_NS ? process.env.CIPHER_NS : 'proxy', 
    CIPHER_NID: process.env.CIPHER_NID ? process.env.CIPHER_NID : 0
  });

}

