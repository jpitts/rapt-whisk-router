#!/usr/bin/env bash

# defaults

VERSION="2.6.17"

# directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../
DIR=`pwd`

./redis-$VERSION/bin/redis-server ./config/redis-2.6.conf

