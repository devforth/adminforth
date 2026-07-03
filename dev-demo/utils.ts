import LevelDBKeyValueAdapter from '../adapters/adminforth-key-value-adapter-leveldb/index.js';
import RedisKeyValueAdapter from '../adapters/adminforth-key-value-adapter-redis/index.js';
import ResourceKeyValueAdapter from '../adapters/adminforth-key-value-adapter-resource/index.js';
import RAMKeyValueAdapter from '../adapters/adminforth-key-value-adapter-ram/index.js';

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

// Uncomment if you have running Redis instance
// export const redisAdapter = new RedisKeyValueAdapter({
//   redisUrl: 'redis://localhost:6379/0',
// })