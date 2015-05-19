#!/usr/bin/env bash

# defaults

VERSION="2.6.17"

# directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../
DIR=`pwd`

wget http://download.redis.io/releases/redis-$VERSION.tar.gz
mv redis-$VERSION.tar.gz downloads/



