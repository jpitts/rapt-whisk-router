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

echo "Stop testing whisk!"

# proxy
echo "Stop the proxy on screen 1"
CMD="screen -S $SCREENID -p1 -X stuff \$'\03 cd $DIR \03'"
eval $CMD

# web
echo "Stop the web-0 service on screen 2"
CMD="screen -S $SCREENID -p2 -X stuff \$'\03 cd $DIR/components \03'"
eval $CMD
echo "Stop the web-1 service on screen 3"
CMD="screen -S $SCREENID -p3 -X stuff \$'\03 cd $DIR/components \03'"
eval $CMD

# websocket
echo "Stop the ws-0 service on screen 4"
CMD="screen -S $SCREENID -p4 -X stuff \$'\03 cd $DIR/components \03'"
eval $CMD
echo "Stop the ws-1 service on screen 5"
CMD="screen -S $SCREENID -p5 -X stuff \$'\03 cd $DIR/components \03'"
eval $CMD

# worker
echo "Stop the worker on screen 6"
CMD="screen -S $SCREENID -p6 -X stuff \$'\03 cd $DIR/components \03'"
eval $CMD

# stop redis
echo "Stop redis on screen 7"
CMD="screen -S $SCREENID -p7 -X stuff \$'\03 cd $REDISDIR && \03'"
eval $CMD

# stop screen
echo "Stop the screen session"
CMD="screen -X -S $SCREENID quit"
eval $CMD

echo "Done."
