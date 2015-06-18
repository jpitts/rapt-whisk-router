#!/usr/bin/env bash

WHISK_SYSTEM_NAME=rapt-whisk-router
DOCKER_NODE_IMAGE_NAME=jpitts/node-v0.10.38
DOCKER_REDIS_IMAGE_NAME=jpitts/redis-2.6

# shared volume (allowing source code editing)
HEWO_VOLUME_NAME=rapt-whisk-hello-world-volume

# redis
HEWO_REDIS_NAME=rapt-whisk-hello-world-redis
HEWO_REDIS_PORT=6379

# web node
HEWO_WEB_NODE_NAME=rapt-whisk-hello-world-web
HEWO_WEB_NODE_PORT=8888

# websocket nodes
HEWO_WS0_NODE_NAME=rapt-whisk-hello-world-ws0
HEWO_WS0_NODE_PORT=8889
HEWO_WS1_NODE_NAME=rapt-whisk-hello-world-ws1
HEWO_WS1_NODE_PORT=8890
HEWO_WS2_NODE_NAME=rapt-whisk-hello-world-ws2
HEWO_WS2_NODE_PORT=8891


