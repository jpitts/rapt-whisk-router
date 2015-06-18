#!/usr/bin/env bash

echo "Start hello-world docker instances!"

# hello-world docker bin directory and rapt-whisk-router source directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../../ # hello-world example dir
cd ../../ # rapt-whisk-router dir
DIR=`pwd`
cd $DIR

# load the environment variables
cd $BINDIR
echo $BINDIR
source ./load_env.sh

# set the host name

# NOTE: in osx, boot2docker uses an ip addr (as opposed to linux, which uses localhost)
#   this is used in the html's calls to websockets

BOOT2DOCKER_IP=`boot2docker ip`
echo "Starting rapt-whisk-router system for host=$HEWO_HOST_NAME"

# now ready to begin
cd $DIR

# shared volume

echo "Create a shared volume named $HEWO_VOLUME_NAME."

docker create \
  -v $DIR:/opt/$WHISK_SYSTEM_NAME \
  --name $HEWO_VOLUME_NAME \
  $DOCKER_NODE_IMAGE_NAME \
  /bin/true

sleep 1
docker ps -a | grep $HEWO_VOLUME_NAME


# redis

echo "Create a redis instance named $HEWO_REDIS_NAME."

docker run -d \
  -p $HEWO_REDIS_PORT:$HEWO_REDIS_PORT \
  --name $HEWO_REDIS_NAME \
  $DOCKER_REDIS_IMAGE_NAME \
  /bin/bash -c "/usr/local/bin/redis-server /etc/redis/redis.conf"

sleep 1
docker ps -a | grep $HEWO_REDIS_NAME


# web node

echo "Create a web instance named $HEWO_WEB_NODE_NAME."

docker run -d \
  -p $HEWO_WEB_NODE_PORT:$HEWO_WEB_NODE_PORT \
  --name $HEWO_WEB_NODE_NAME \
  --volumes-from $HEWO_VOLUME_NAME \
  --link $HEWO_REDIS_NAME:$HEWO_REDIS_NAME \
  --env HEWO_WEB_HOST=$BOOT2DOCKER_IP \
  --env HEWO_REDIS_HOST=$HEWO_REDIS_NAME \
  $DOCKER_NODE_IMAGE_NAME \
  /bin/bash -c "cd /opt/$WHISK_SYSTEM_NAME/examples/hello-world; node web_server.js"


# ws0 node

echo "Create a ws0 instance named $HEWO_WS0_NODE_NAME."

docker run -d \
  -p $HEWO_WS0_NODE_PORT:$HEWO_WS0_NODE_PORT \
  --name $HEWO_WS0_NODE_NAME \
  --volumes-from $HEWO_VOLUME_NAME \
  --link $HEWO_REDIS_NAME:$HEWO_REDIS_NAME \
  --env HEWO_WS_HOST=$BOOT2DOCKER_IP \
  --env HEWO_REDIS_HOST=$HEWO_REDIS_NAME \
  --env WS_NID=0 \
  $DOCKER_NODE_IMAGE_NAME \
  /bin/bash -c "cd /opt/$WHISK_SYSTEM_NAME/examples/hello-world; node websocket_server.js"


# ws1 node

echo "Create a ws1 instance named $HEWO_WS1_NODE_NAME."

docker run -d \
  -p $HEWO_WS1_NODE_PORT:$HEWO_WS1_NODE_PORT \
  --name $HEWO_WS1_NODE_NAME \
  --volumes-from $HEWO_VOLUME_NAME \
  --link $HEWO_REDIS_NAME:$HEWO_REDIS_NAME \
  --env HEWO_WS_HOST=$BOOT2DOCKER_IP \
  --env HEWO_REDIS_HOST=$HEWO_REDIS_NAME \
  --env WS_NID=1 \
  $DOCKER_NODE_IMAGE_NAME \
  /bin/bash -c "cd /opt/$WHISK_SYSTEM_NAME/examples/hello-world; node websocket_server.js"


# ws2 node

echo "Create a ws2 instance named $HEWO_WS2_NODE_NAME."

docker run -d \
  -p $HEWO_WS2_NODE_PORT:$HEWO_WS2_NODE_PORT \
  --name $HEWO_WS2_NODE_NAME \
  --volumes-from $HEWO_VOLUME_NAME \
  --link $HEWO_REDIS_NAME:$HEWO_REDIS_NAME \
  --env HEWO_WS_HOST=$BOOT2DOCKER_IP \
  --env HEWO_REDIS_HOST=$HEWO_REDIS_NAME \
  --env WS_NID=2 \
  $DOCKER_NODE_IMAGE_NAME \
  /bin/bash -c "cd /opt/$WHISK_SYSTEM_NAME/examples/hello-world; node websocket_server.js"



sleep 1
docker ps -a | grep $HEWO_WEB_NODE_NAME


echo "Done!"
