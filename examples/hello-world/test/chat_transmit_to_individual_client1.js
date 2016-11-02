
casper.echo('Start individual client1');

/*
  attrs:
    casper.cli.get(0) - script name
    casper.cli.get(1) - service URL
*/    

var service_url = casper.cli.get(1) ? casper.cli.get(1) : 'http://localhost:8888';

var num_tests = 1;
var casper_site = undefined;
var timeouts = {
  until_done: 5000
};

/*
  utility functions
*/

var log = function (level, descr, attr) {
  //console.log(level + ': Session Test: ' + descr);
  casper.echo('Client1: ' + descr);
}


/*
  start the test
*/

casper.test.begin('Transmit to individual client', num_tests, function suite (test) {
  //var test = this;

  log('warn', 'Start client');


  /* 
     start: go to the web service endpoint
     site title test
  */

  log('warn', 'Visit "' + service_url + '"');
  
  casper.start(service_url, function() {
    casper_site = this;
     
    log('warn', 'Loaded "' + casper_site.getTitle() + '"');

  }); // END casper.start



  /*
     then: additional tests
  */

  casper.then(function () {
    log('warn', 'Continue testing "' + casper_site.getTitle() + '"');
    
    test.assertTitle("Hello, World!", "The expected title is 'Hello, World!'");
    
  });



  /*
    chat entry test
  */

  casper.waitForSelector('#chat-entry', function() {
    log('warn', 'Loaded #chat-entry selector');
    //require('utils').dump(this.getElementsInfo('#chat-entry'));
    var elem = this.getElementsInfo('#chat-entry');
    
    setTimeout(function () {
    
      casper.evaluate(function(chat_msg) {
        document.querySelector('#chat-entry').value = chat_msg;
        document.querySelector('#button-chat-entry').click();
      }, "Hello, Primary Client!" // chat message to send
      );

    }, 1000);

  });



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


