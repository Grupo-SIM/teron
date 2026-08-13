export MODEL_VERSION=$(node ../common/scripts/show_version.js)
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_ENDPOINT=teron.local:9000
export MONGO_URL=mongodb://teron.local:27017
export DB_URL=mongodb://teron.local:27017
export ACCOUNT_DB_URL=postgresql://root@teron.local:26257/defaultdb?sslmode=disable
export ACCOUNTS_URL=http://teron.local:3000
export TRANSACTOR_URL=ws://teron.local:3333
export ELASTIC_URL=http://teron.local:9200
export SERVER_SECRET=secret
export QUEUE_CONFIG=teron.local:19093

# Restore workspace contents in mongo/elastic
node ../dev/tool/bundle/bundle.js $@