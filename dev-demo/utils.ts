import LevelDBKeyValueAdapter from '../adapters/adminforth-key-value-adapter-leveldb/index.js';
import RedisKeyValueAdapter from '../adapters/adminforth-key-value-adapter-redis/index.js';

export const levelDbAdapter = new LevelDBKeyValueAdapter({
  dbPath: './testdb',
});

// export const redisAdapter = new RedisKeyValueAdapter({
//   redisUrl: 'redis://localhost:6379',
// })