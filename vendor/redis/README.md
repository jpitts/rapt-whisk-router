# Redis 2.6.17

Whisk implementations require redis in order to manage sessions and share data between nodes. If you do not have it running already you can use these convenient scripts to download, install, and run the correct redis version.

## Install Redis

```
./bin/download-redis.sh
./bin/install-redis.sh
ls redis-2.6.17
```

## Run Redis

```
./bin/run-redis.sh
```

## Configure Redis

The run script uses config/redis-2.6.conf. This is a copy of the configuration that comes with redis. 

