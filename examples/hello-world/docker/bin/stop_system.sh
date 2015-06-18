#!/usr/bin/env bash

echo "Stop hello-world docker instances!"

# hello-world docker bin directory and rapt-whisk-router source directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../../ # hello-world example dir
cd ../../ # rapt-whisk-router dir
DIR=`pwd`

# load the environment variables
cd $BINDIR
echo $BINDIR
source ./load_env.sh

# now ready to begin
cd $DIR

# stop and remove ws0 node (noisily)
echo "Stop and remove ws0 instance named $HEWO_WS0_NODE_NAME."
docker stop $HEWO_WS0_NODE_NAME
docker rm $HEWO_WS0_NODE_NAME
docker ps -a | grep $HEWO_WS0_NODE_NAME

# stop and remove ws1 node (noisily)
echo "Stop and remove ws1 instance named $HEWO_WS1_NODE_NAME."
docker stop $HEWO_WS1_NODE_NAME
docker rm $HEWO_WS1_NODE_NAME
docker ps -a | grep $HEWO_WS1_NODE_NAME

# stop and remove ws2 node (noisily)
echo "Stop and remove ws2 instance named $HEWO_WS2_NODE_NAME."
docker stop $HEWO_WS2_NODE_NAME
docker rm $HEWO_WS2_NODE_NAME
docker ps -a | grep $HEWO_WS2_NODE_NAME

# stop and remove web node (noisily)
echo "Stop and remove web instance named $HEWO_WEB_NODE_NAME."
docker stop $HEWO_WEB_NODE_NAME
docker rm $HEWO_WEB_NODE_NAME
docker ps -a | grep $HEWO_WEB_NODE_NAME

# stop and remove redis (noisily)
echo "Stop and remove redis instance named $HEWO_REDIS_NAME."
docker stop $HEWO_REDIS_NAME
docker rm $HEWO_REDIS_NAME
docker ps -a | grep $HEWO_REDIS_NAME

# remove the shared volume (noisily)
echo "Stop and remove shared volume named $HEWO_VOLUME_NAME."
docker stop $HEWO_VOLUME_NAME
docker rm $HEWO_VOLUME_NAME
docker ps -a | grep $HEWO_VOLUME_NAME

echo "Done!"
