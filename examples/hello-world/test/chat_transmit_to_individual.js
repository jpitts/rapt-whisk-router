/*
  
  Chat Transmit to Individual Test

  NOTE: The shell script spawns additional node processes (representing other clients in a room).

  Overview:
    
    Test involves two casperjs instances interactingL "Primary Client" and "Client1". 
    Both clients visit http://localhost:8888.
    A chat message is confirmed sent by primary to client1.

  Usage:
    
    Run simultaneously:
    casperjs test chat_transmit_to_individual_client1.js
    casperjs test chat_transmit_to_individual.js

  Basic tasks of this test:

    Page loads (title content tested)
    Websocket connection (status indicator tested)
    Chat received (chat div content tested)

*/


/*
  attrs:
    casper.cli.get(0) - script name
    casper.cli.get(1) - service URL
*/    

var service_url = casper.cli.get(1) ? casper.cli.get(1) : 'http://localhost:8888';

var num_tests = 3;
var casper_site = undefined;
var timeouts = {
  until_chat_test: 5000,
  until_done: 6000
};


/*
  utility functions
*/

var log = function (level, descr, attr) {
  //console.log(level + ': Session Test: ' + descr);
  casper.echo('Primary Client: ' + descr);
}

var identify_new_elements = function (attr) {
  /* attrs:
      except_element
      sets
  */
  
  for (var s=0; s<attr.sets.length; s++) {
    var set = attr.sets[s];
    console.log('set ' + s + ' length=' + set.length);  
  }

  return {

  };
  
}


/* 
  set ups
*/

casper.test.setUp(function() {
  log('warn', 'Set up');

}); // END casper.test.setUp


/*
  start the test
*/

casper.test.begin('Transmit to individual client', num_tests, function suite (test) {
  //var test = this;

  var is_room_ready=false;
  var is_room_entered=false;
  var other_user_id = undefined;
  var message_hist = [];     
  var recent_chat_message = undefined;
  var is_chat_sent = false;

  log('warn', 'Start primary client');

  /* 
     start: go to the web service endpoint
  */

  log('warn', 'Visit "' + service_url + '"');
  
  casper.start(service_url, function() {
    casper_site = this;
     
    log('warn', 'Loaded "' + casper_site.getTitle() + '"');
    test.assertTitle("Hello, World!", "The expected title is 'Hello, World!'");

  }); // end casper.start


  /*
    status indicator test
  */

  casper.waitForSelector('#world-notice', function() {
    log('warn', 'Loaded #world-notice selector');
    var page = this;

    //require('utils').dump(page.getElementsInfo('#world-notice'));
    var elem = page.getElementsInfo('#world-notice');
    test.assertMatch(elem[0].html, /^Connected to ws\-/i, "Active connection indicator expected.");

  }); // END status indicator test


  /*
    chat from client1 test
  */

  casper.waitForSelector('#world-reply', function() {
    log('warn', 'Loaded #world-reply selector');
    var page = this;
    //require('utils').dump(page.getElementsInfo('#world-reply'));
     
    // wait until chat message has been received
    setTimeout(function () {
      log('warn', 'Testing for messages on #world-reply selector');
      var elem = page.getElementsInfo('#world-reply');
      test.assertMatch(elem[0].html, /Hello\, Primary Client/i, "Chat message from client1 expected.");

    }, timeouts.until_chat_test);

  }); // end chat message test



  /* 
    run and then done
  */

  casper.run(function() {
    var run = this;
    
    log('warn', 'Will now wait ' + timeouts.until_done + ' ms...');

    // wait, then exit (so that the client0 may perform its tests)
    setTimeout(function () {
      log('warn', 'Done.');
      test.done();
    }, timeouts.until_done);
    
  });

}); // END test


