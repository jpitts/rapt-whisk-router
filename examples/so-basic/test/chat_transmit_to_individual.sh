#!/usr/bin/env bash

# directory
TESTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $TESTDIR
cd ../
DIR=`pwd`

cd $TESTDIR

# run client1
#node chat_transmit_to_individual_client1.js &
#client1pid=$!

# run test
../node_modules/mocha/bin/mocha --timeout 25000 chat_transmit_to_individual.js

#echo "client1 pid=$client1pid"

#while kill -0 $client1pid >/dev/null 2>&1
#do 
#    echo "client1 still running with pid=$client1pid"
#    sleep 1
#done

echo "Done."

