#!/usr/bin/env bash

# directory
TESTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $TESTDIR
cd ../
DIR=`pwd`

cd $TESTDIR

echo "Test Control: start"


# run phantomjs test
phantomjs phantom_test.js

# run casperjs test
casperjs test casper_test.js

# run client1
casperjs test chat_transmit_to_individual_client1.js &
client1pid=$!
echo "Test Control: start client1 pid=$client1pid"

# run primary test
casperjs test chat_transmit_to_individual.js &
primaryclientpid=$!
echo "Test Control: start primary client pid=$primaryclientpid"


#while kill -0 $client1pid >/dev/null 2>&1
#do 
#    echo "client1 still running with pid=$client1pid"
#    sleep 1
#done

echo "Done."

