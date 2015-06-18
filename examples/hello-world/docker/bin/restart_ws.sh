#!/usr/bin/env bash

# hello-world docker bin directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR

# load the environment variables
source ./load_env.sh

# restart
docker restart $HEWO_WS0_NODE_NAME
docker restart $HEWO_WS1_NODE_NAME
docker restart $HEWO_WS2_NODE_NAME

