---
description: "Reference page for AdminForth storage adapters, covering Amazon S3 and local file storage backends used by upload and media workflows."
---

# Storage Adapters

Used for storing files.

[StorageAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/StorageAdapter.ts#L8)

## Amazon S3 Storage Adapter

```bash
pnpm add @adminforth/storage-adapter-amazon-s3
```

Stores uploaded files in [Amazon S3](https://aws.amazon.com/s3/), providing scalable cloud storage. 

## S3 compatible adapter
```bash
pnpm add @adminforth/storage-adapter-s3-compatible
```

Provides S3 compatible interface for object storage services such as MinIO, Wasabi, Cloudflare R2 or other third-party S3 providers.

>‼️Since levelDb is used for storing keys of objects that should/shouldn't be deleted, so this is important to use docker volume on deployed application, so you will not loose this data after re-deploy 

>‼️It is not recomended to use the same Key/value adapter for the adapter multiple instances, because it can cause unpredictable behavior of cleanup scheduler

### Cloudflare R2 setup example

This adapter requires key/value adapter. For example, we will be using levelDb adapter.
```bash
pnpm add @adminforth/key-value-adapter-leveldb
```

1) Go to the [Cloudflare dashboard](https://dash.cloudflare.com/) and create new bucket. Get bucket URL.
2) Get R2 Access key id and Secret access key
3) Add in the .env file: 
```
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT_URL=your_bucket_url
R2_BUCKET_NAME=your_bucket_name
R2_BUCKET_REGION=auto
```
4) Setup adapter:
```ts
  import LevelDBKeyValueAdapter from '@adminforth/key-value-adapter-leveldb';

  new AdminForthAdapterS3CompatibleStorage({
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    endpoint: process.env.R2_ENDPOINT_URL as string,
    bucket: process.env.R2_BUCKET_NAME as string,
    region: process.env.R2_BUCKET_REGION as string,
    s3ACL: "private",
    cleanupKeyValueAdapter: new LevelDBKeyValueAdapter({
      dbPath: './stores/cloudflare_r2_storage_keys',
    }),
    forcePathStyle: true,
    cleanupCheckInterval: '30m',
    cleanupGracePeriod: '5d'
  }),
```

### MinIO setup

1) If you don't have running instanse, then run it with command
```bash
  docker run \
    -p 9000:9000 \
    -p 9001:9001 \
    -e MINIO_ROOT_USER=minioadmin \
    -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio server /data --console-address ":9001"
```
2) Go to http://127.0.0.1:9000 and create bucket
3) Setup adapter: 
```ts
  import LevelDBKeyValueAdapter from '@adminforth/key-value-adapter-leveldb';

  new AdminForthAdapterS3CompatibleStorage({
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    endpoint: 'http://localhost:9000',
    bucket: 'adminforth-dev-demo',
    region: 'us-east-1',
    s3ACL: 'private',
    cleanupKeyValueAdapter: new LevelDBKeyValueAdapter({
      dbPath: './stores/minio_storage_keys',
    }),
    forcePathStyle: true,
    cleanupCheckInterval: '30m',
    cleanupGracePeriod: '5d'
  }),
```

## Local Storage Adapter

```bash
pnpm add @adminforth/storage-adapter-local
```

Stores files locally on the server filesystem. It is suitable for development or small self-hosted setups, but cloud storage is generally a better production option for reliability and scalability.