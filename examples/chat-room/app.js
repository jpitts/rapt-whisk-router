
/*

  Chat Room All-In-One Test Stack

  This runs the chat-room stack for testing and demo purposes. If run, app.js will
  init 2 web servers, a worker, and the proxy in a single node process,
  as well as 2 websocket servers in a forever-monitor.
  
  Requirements: a redis instance is required to be running. There are instructions 
  in the vendor directory about downloading and running redis.
  
  If you want to run chat-room in production, look at "bin/start_test_stack.sh". 
  This is a shell script that can be used to run all of the chat-room nodes inside 
  of a screen session.

*/


/* 
  node module dependencies
*/

var forever = require('forever-monitor')
  , Web = require('./components/web_service')
  , Worker = require('./components/worker')
  , Proxy = require('./components/proxy')

;

// initialize the context
require('./lib/ChatRoom').init({}, function (err, CHRO) {


  CHRO.log('info', 'CHRO app.js: Start the Chat Room stack.');

   
  // init web services
  var web_nodes = CHRO.config.web.nodes;
  if (web_nodes && web_nodes.length) {
    web_nodes.forEach(function (node, idx) {
      Web.init({ CIPHER_NS: 'web', CIPHER_NID: idx });      
      CHRO.log('info', 'CHRO app.js: Web' + idx + ' started.');
    });
  }

  // init ws services
  // NOTE: unfortunately, these require separate processes
  var websocket_nodes = CHRO.config.websocket.nodes;
  if (websocket_nodes && websocket_nodes.length) {
    websocket_nodes.forEach(function (node, idx) {
      
      // set up a forever monitor for WS    
      node.forever_monitor = new (forever.Monitor)('components/websocket_service.js', {
        max: 1, silent: false,
        args: [],
        env: {
          CHRO_STANDALONE: true,
          CIPHER_NID: idx
        }
      });
      
      node.forever_monitor.on('start', function () {
        CHRO.log('info', 'CHRO app.js: WS' + idx + ' started.');
      });      

      node.forever_monitor.on('exit', function () {
        CHRO.log('info', 'CHRO app.js: WS' + idx + ' exited.');
      });
      
      node.forever_monitor.on('error', function (err) {
        CHRO.log('info', 'CHRO app.js: WS' + idx + ' error:' + err + '.');
      });
      
      // start the WS service
      node.forever_monitor.start();

    });
  }

  // init workers
  var worker_nodes = CHRO.config.worker.nodes;
  if (worker_nodes && worker_nodes.length) {
    worker_nodes.forEach(function (node, idx) {
      Worker.init({ CIPHER_NS: 'worker', CIPHER_NID: idx });
      CHRO.log('info', 'CHRO app.js: Worker' + idx + ' started.');
    });
  }

  // proxy
  Proxy.init({
    //WEB_NODES: web_nodes.length, WS_NODES: websocket_nodes.length, 
    CIPHER_NS: 'proxy', CIPHER_NID: 0, 
    //context: CHRO,
  });
  CHRO.log('info', 'CHRO app.js: Proxy started.');


  CHRO.log('info', 'CHRO app.js: The Chat World stack has been started.');


}); // END ChatRoom init

