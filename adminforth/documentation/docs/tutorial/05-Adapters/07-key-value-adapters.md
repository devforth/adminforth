# Key-value Adapters

Key-value adapters are used to store data in a key-value format. They provide a simple and efficient way to manage data where quick access to values based on unique keys is required.

[Key-value adapter source class](https://github.com/devforth/adminforth/blob/86bb9236fed9e844fdb07688318c050641f9eb1c/adminforth/types/adapters/KeyValueAdapter.ts#L6)

## RAM Adapter

```bash
pnpm i @adminforth/key-value-adapter-ram
```

The RAM adapter is a simple in-memory key-value store. It keeps data in process memory, so it is not suitable for multi-process deployments because each process would have its own isolated store. In that case you need a centralized KV adapter such as Redis.

Pros:

- Simplest to use and does not require an external daemon.

Cons:

- Suitable for single-process installations only.

## Redis Adapter

```bash
pnpm i @adminforth/key-value-adapter-redis
```

Redis uses in-memory storage with $O(1)$ get complexity. It is a great fit for lightweight workloads that fit in RAM, and it also works well for multi-process or replica-based installations as a centralized store. If persistence across restarts is important, configure Redis persistence separately.

```ts
import RedisKeyValueAdapter from '@adminforth/key-value-adapter-redis';

const adapter = new RedisKeyValueAdapter({
  redisUrl: '127.0.0.1:6379',
});

adapter.set('test-key', 'test-value', 120);
```

## LevelDB Adapter

```bash
pnpm i @adminforth/key-value-adapter-leveldb
```

LevelDB uses disk storage with $O(\log n)$ get complexity. It is a good fit for large or persistent KV datasets that still require fast lookups but do not efficiently fit in RAM. This is a single-process adapter only, so multiple admin processes should not point to the same LevelDB directory.

You can use replicas with isolated disks, but in that case the state will also be isolated between replicas.

```ts
import LevelDBKeyValueAdapter from '@adminforth/key-value-adapter-leveldb';

const adapter = new LevelDBKeyValueAdapter({
  dbPath: './testdb',
});

adapter.set('test-key', 'test-value', 120);
```