#!/usr/bin/env bash

# hello-world docker bin directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR

# load the environment variables
source ./load_env.sh

# restart
docker restart $HEWO_WEB_NODE_NAME

