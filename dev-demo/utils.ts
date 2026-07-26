import LevelDBKeyValueAdapter from '../adapters/adminforth-key-value-adapter-leveldb/index.js';
import RedisKeyValueAdapter from '../adapters/adminforth-key-value-adapter-redis/index.js';
import ResourceKeyValueAdapter from '../adapters/adminforth-key-value-adapter-resource/index.js';
import RAMKeyValueAdapter from '../adapters/adminforth-key-value-adapter-ram/index.js';
import AdminForthAdapterS3Storage from '../adapters/adminforth-storage-adapter-amazon-s3/index.js'; 

export const levelDbAdapter = new LevelDBKeyValueAdapter({
  dbPath: './testdb',
});

export const resourceAdapter = new ResourceKeyValueAdapter({
  resourceId: 'key_values',
  keyField: 'key',
  valueField: 'value',
  collectionField: 'collection',
  expireField: 'expire_at',
})

export const ramAdapter = new RAMKeyValueAdapter();

export const s3StorageAdapter = process.env.AWS_ACCESS_KEY_ID ? new AdminForthAdapterS3Storage({
  bucket: process.env.AWS_BUCKET_NAME as string,
  region: process.env.AWS_REGION as string,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  s3ACL: "public-read"
}) : null;

// Uncomment if you have running Redis instance
// export const redisAdapter = new RedisKeyValueAdapter({
//   redisUrl: 'redis://localhost:6379/0',
// })