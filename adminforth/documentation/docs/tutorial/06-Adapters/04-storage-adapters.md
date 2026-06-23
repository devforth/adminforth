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
### How the adapter works:

The Amazon S3 adapter uses tagging to mark objects with the special tag `adminforth-candidate-for-cleanup`, and then creates a lifecycle rule that automatically expires objects with that tag.
But not all S3-compatible adapters support tagging, so this adapter has a built-in cleanup mechanism and you have two options:

**1) Pass an optional key/value adapter, where all object keys scheduled for deletion will be stored**

Why use it?

There are a few reasons to do so:

- When somebody uploads a file in a record and doesn't press the "Save" button, the file will be marked for deletion and you don't have to pay for storing it
- If you accidentally delete a file, you'll have a time window to restore it

>If you are using a key/value adapter, it is important to retain the object keys, because if the key-value storage is cleared, all objects marked for deletion will not be cleaned up and you'll have to pay for storing files you no longer use

>We recommend using `@adminforth/key-value-adapter-resource`, because chance, that database will be cleaed is low

>‼️If you are using LevelDB to store keys of objects that should/shouldn't be deleted, it is important to use a Docker volume on the deployed application so you will not lose this data after a redeployment

>‼️It is not recommended to use the same Key/value adapter for multiple adapter instances, because it can cause unpredictable behavior of the cleanup scheduler

**2) Don't use key/value adapter**

If you don't want to use a key/value adapter and you don't need to clean up files, you can simply not pass an adapter
> Note: if you don't pass an adapter, all connected files will be deleted immediately when you delete a record.

> If somebody uploaded a file and didn't save the record, you will pay for the storage until the file is removed manually

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
      // ensure /stores/ folder is a persisted/backed up point, if you running in docker ensure ensure you mount /stores/ as volume
      dbPath: process.env.NODE_ENV === production ? '/stores/cloudflare_r2_storage_keys' : './cloudflare_r2_storage_keys',
    });,
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
      // ensure /stores/ folder is a persisted/backed up point, if you running in docker ensure ensure you mount /stores/ as volume
      dbPath: process.env.NODE_ENV === production ? '/stores/minio_storage_keys' : './minio_storage_keys',
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