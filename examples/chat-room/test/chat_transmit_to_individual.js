/*
  
  Chat Transmit to Individual Mocha Test

  NOTE: The shell script spawns additional node processes (representing other clients in a room).

  Overview:
    
    Test involves JQGO client0 and node-based client1. Both clients visit http://localhost:8080.
    Node-based client1's ID is extracted from in-page status message.
    A chat message is confirmed sent by client0 to client1.

  Usage:

    ../node_modules/mocha/bin/mocha --timeout 25000 chat_transmit_to_individual.js

  Basic tasks of this test:

    JQGO: visit/wait/get page http://localhost:8080

    JQGO: user clicks to enter beach 

    UNTIL user enter room
      THEN SET user_id
    
    UNTIL other user identified
      EXTRACT other_user_id
      THEN SET other_user_id
      THEN JQGO send chat to other_user

    UNTIL chat sent
      EXTRACT chat text
      THEN SET recent_chat_message AND is_chat_sent

*/

var forever = require('forever-monitor')
  , assert = require("assert")
  , jqgo = require('jquerygo')
  , async = require('async')
;


/*
  utilities
*/

var test_log = function (level, descr, attr) {
  console.log(level + ': Session Test: ' + descr);
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
  start test client
*/

var test_clients = {
  client1: {}
};

var start_test_client = function (clientId) {
  
  var name = 'client' + clientId;
  var test_client = test_clients[name];
  test_log('info', name + ': start test client');
  
  // set up a forever monitor for WS    
  test_client.forever_monitor = new (forever.Monitor)('./chat_transmit_to_individual_client1.js', {
    max: 1, silent: false,
    args: [],
    env: { TEST_CLIENT: clientId }
  });
  
  test_client.forever_monitor.on('start', function () {
    test_log('info', name + ': started.');
  });      

  test_client.forever_monitor.on('exit', function () {
    test_log('info', name + ': exited.');
  });
  
  test_client.forever_monitor.on('error', function (err) {
    test_log('info', name + ': error:' + err + '.');
  });
  
  // start the WS service
  test_client.forever_monitor.start();

}

var stop_test_client = function (clientId) {
  
  var name = 'client' + clientId;
  var test_client = test_clients[name];
  test_log('info', name + ': stop test client');
  
  test_client.forever_monitor.stop();   
}


/* 
  main test body
*/

describe('Page', function(){

  
  before(function () {
    start_test_client(1);
  });


  it('should send a chat to other user in room', function(done_testing){
    
    var is_room_ready=false;
    var is_room_entered=false;
    var other_user_id = undefined;
    var message_hist = [];     
    var recent_chat_message = undefined;
    var is_chat_sent = false;

    // JQGO: visit/wait/get page http://localhost:8080
        
    jqgo.visit('http://localhost:8080/', function() {
      test_log('info','visit');
      
      // phantom.js waitForPage  
      jqgo.waitForPage(function(){
        test_log('info','waitForPage');

        // phantom.js getPage
        jqgo.getPage(function(page) {
          test_log('info', 'getPage');
          
          var eval_attr = { // data passed to the evaluate
            test_log: test_log 
            // NOTE: functions are not passed for some reason 
            //  (test_log will be undefined on the other side)
          };


          // UNTIL room ready / websockets active
          //  THEN SET is_room_ready
          //  THEN CLICK on enter beach button
          var untilRoomReadyCount = 0;
          async.until(
            // until test
            function () {

              jqgo('#status').html(function(message) {
                //console.log('status message: ' + message); 
                //Connection to Chat Room active.
                var regex = /Connection\ to\ Chat\ Room active/g;
                if (message.match(regex)) {
                  console.log('room is ready');
                  is_room_ready=true;
                }
              });

              return ( is_room_ready || untilRoomReadyCount > 8);
            },
            // on each test return false
            function (waitCb) {
              console.log('untilRoomReadyCount ' + untilRoomReadyCount);
              untilRoomReadyCount++;
              setTimeout(waitCb, 500);
            },
            // on test return true
            function (err, results) {

              if (is_room_ready) {
                console.log('done waiting, room is ready');

                // JQGO: user clicks to enter beach 
                jqgo('#button-enter-beach').click(function() {
                //jqgo('#button-enter-dog_park').click(function() { // NOTE: this would cause the location test to fail
                }); // END button click

              } else {
                console.log('done waiting, room was NOT ready after untilRoomReadyCount ' + untilRoomReadyCount);
                done_testing("Room was not ready in time.");
              }

            }
          ); // END UNTIL room ready / websockets active
 
          
          // UNTIL user enter room
          //  THEN SET user_id
          var untilEnterRoomCount = 0;
          async.until(
            // until test
            function () {

              jqgo('#message').html(function(message) {
                
                //You relocated to the beach!
                var regex = /You\ relocated\ to\ the\ beach/g;
                if (message.match(regex)) {
                  console.log('user has entered room');
                  is_room_entered=true;
                }
              });

              return ( is_room_entered || untilEnterRoomCount > 5);
            },
            // on each test return false
            function (waitCb) {
              console.log('untilEnterRoomCount ' + untilEnterRoomCount);
              untilEnterRoomCount++;
              setTimeout(waitCb, 1000);
            },
            // on test return true
            function (err, results) {

              //assert.equal(is_room_entered, true,
              //  "Room was not entered by test user.");

              if (is_room_entered) {
                console.log('done waiting, user has entered room');
              } else {
                console.log('done waiting, user did NOT enter room after untilEnterRoomCount ' + untilEnterRoomCount);
                done_testing("Room was not entered by test user.");
              }

            }
          ); // END UNTIL user enter room
            
          
          // UNTIL other user identified
          //  EXTRACT other_user_id
          //  THEN SET other_user_id
          //  THEN JQGO send chat to other_user
          var untilOtherIDCount = 0;
          async.until(
            // until test
            function () {
              console.log('checking for other user identified ' + untilOtherIDCount);

              jqgo('#message').html(function(message) {
                //User 2984129198 relocated to the beach!
                var regex = /User\sID=(.*)\s/g;
                if (message.match(regex)) {
                  splitMessage = message.split(/(\ |ID=)/);
                  console.log('other User ID=' + splitMessage[4]);
                  other_user_id=splitMessage[4];
                }
              });

              return (other_user_id || untilOtherIDCount > 10);
            },
            // on each test return false
            function (waitCb) {
              console.log('untilOtherIDCount ' + untilOtherIDCount);
              untilOtherIDCount++;
              setTimeout(waitCb, 1000);
            },
            // on test return true
            function (err, results) {
              
              //assert.equal( (other_user_id !== 'undefined') , true,
              //  "Other user could not be identified.");

              if (other_user_id) {
                console.log('done waiting, other user ID=' + other_user_id);
                
                var chat_text = '@' + other_user_id + ': Hello!';

                jqgo('#chat-entry').val(chat_text, function() {
                  jqgo('#button-chat-entry').click(function() {
                    console.log('sent chat via UI interaction: ' + chat_text);
                  });
                });


              } else {
                console.log('done waiting, other user did NOT enter room after untilOtherIDCount ' + untilOtherIDCount);
                done_testing("Other user could not be identified.");
              }
              

            }
          ); // END UNTIL other user identified
          

          // UNTIL chat sent
          //  EXTRACT chat text
          //  THEN SET recent_chat_message AND is_chat_sent
          var untilChatSentCount = 0;
          async.until(
            // until test
            function () {

              jqgo('#chat-messages').html(function(message) {
                
                //console.log('notification message: ' + message);
                var regex = /Hello!/g;
                var regex = /(.*)\:\s\(private\)/g;
                if (message.match(regex)) {
                  console.log('chat to other user successful');
                  recent_chat_message=message;
                  is_chat_sent=true;
                }
              });

              return ( is_chat_sent || untilChatSentCount > 15);
            },
            // on each test return false
            function (waitCb) {
              console.log('untilChatSentCount ' + untilChatSentCount);
              untilChatSentCount++;
              setTimeout(waitCb, 1000);
            },
            // on test return true
            function (err, results) {

              //assert.equal(is_chat_sent , true, "Chat was not sent to another user in the room.");

              if (is_chat_sent) {
                console.log('done waiting, chat successfully sent');
                
                jqgo.close(); // close the jquerygo connection
                done_testing(); // DONE with testing (success)

              } else {
                console.log('done waiting, chat was NOT sent untilChatSentCount ' + untilChatSentCount);
                done_testing("Chat was not successfully sent to another user in the room.");
              }

            }); // END UNTIL chat sent
            


        }); // END getPage

      }); // END waitForPage

    }); // END visit

  }); // END it should open home page

  

}); // END describe 'open'



