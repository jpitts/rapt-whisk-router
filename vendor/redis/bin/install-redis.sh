#!/usr/bin/env bash

# defaults

VERSION="2.6.17"

# directory
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $BINDIR
cd ../
DIR=`pwd`

echo "Installing redis in $DIR"

cp downloads/redis-$VERSION.tar.gz install/
cd install
tar -zxvf redis-$VERSION.tar.gz
cd redis-$VERSION

make PREFIX=$DIR/redis-$VERSION
make PREFIX=$DIR/redis-$VERSION install

echo "Done! redis is installed in $DIR/redis-$VERSION"
echo "You can start redis using $DIR/bin/run-redis.sh"
echo "SEE: http://redis.io/topics/quickstart"
