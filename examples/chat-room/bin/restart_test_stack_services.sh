#!/usr/bin/env bash

# defaults
SCREENID="chat-room-services"
ENV=""

# directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../
DIR=`pwd`

# redis directory
cd ../../vendor/redis
REDISDIR=`pwd`

cd $DIR

echo "Begin testing whisk!"

# redis
echo "Start redis on screen 7"
CMD="screen -S $SCREENID -p7 -X stuff \$'\03 cd $REDISDIR && bin/run-redis.sh \015'"
eval $CMD

# web
echo "Start the web-0 service on screen 2"
CMD="screen -S $SCREENID -p2 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true CIPHER_NID=0 node web_service.js \015'"
eval $CMD
echo "Start the web-1 service on screen 3"
CMD="screen -S $SCREENID -p3 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true CIPHER_NID=1 node web_service.js \015'"
eval $CMD

# websocket
echo "Start the ws-0 service on screen 4"
CMD="screen -S $SCREENID -p4 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true CIPHER_NID=0 node websocket_service.js \015'"
eval $CMD
echo "Start the ws-1 service on screen 5"
CMD="screen -S $SCREENID -p5 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true CIPHER_NID=1 node websocket_service.js \015'"
eval $CMD

# worker
echo "Start the worker on screen 6"
CMD="screen -S $SCREENID -p6 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true node worker.js \015'"
eval $CMD

# proxy
echo "Start the proxy on screen 1"
CMD="screen -S $SCREENID -p1 -X stuff \$'\03 cd $DIR/components && CHRO_STANDALONE=true node proxy.js \015'"
eval $CMD

echo "Done."
echo "Services are restarted."

