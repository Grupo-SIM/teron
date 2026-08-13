#!/usr/bin/env bash

export MODEL_VERSION=$(node ../common/scripts/show_version.js)
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_ENDPOINT=teron.local:9002
export ACCOUNTS_URL=http://teron.local:3003
export TRANSACTOR_URL=ws://teron.local:3334
export ACCOUNT_DB_URL=postgresql://root@teron.local:26258/defaultdb?sslmode=disable
export MONGO_URL=mongodb://teron.local:27018
export ELASTIC_URL=http://teron.local:9201
export SERVER_SECRET=secret
export DB_URL=$MONGO_URL
export QUEUE_CONFIG=teron.local:19093

# Check if local bundle.js exists and use it if available
BUNDLE_PATH="../dev/tool/bundle/bundle.js"
if [ -f "./bundle.js" ]; then
  BUNDLE_PATH="./bundle.js"
fi

node ${TOOL_OPTIONS} --max-old-space-size=8096 $BUNDLE_PATH $@