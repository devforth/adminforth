import LevelDBKeyValueAdapter from '../adapters/adminforth-key-value-adapter-leveldb/index.js';

export const levelDbAdapter = new LevelDBKeyValueAdapter({
  dbPath: './testdb',
});