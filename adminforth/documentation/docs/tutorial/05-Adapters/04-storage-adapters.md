---
description: "Reference page for AdminForth storage adapters, covering Amazon S3 and local file storage backends used by upload and media workflows."
---

# Storage Adapters

Used for storing files.

[StorageAdapter source class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/StorageAdapter.ts#L8)

## Amazon S3 Storage Adapter

```bash
pnpm i @adminforth/storage-adapter-amazon-s3
```

Stores uploaded files in [Amazon S3](https://aws.amazon.com/s3/), providing scalable cloud storage. It can be forked and customized to work with S3-compatible services such as MinIO, Wasabi, or other third-party S3 providers.

## Local Storage Adapter

```bash
pnpm i @adminforth/storage-adapter-local
```

Stores files locally on the server filesystem. It is suitable for development or small self-hosted setups, but cloud storage is generally a better production option for reliability and scalability.