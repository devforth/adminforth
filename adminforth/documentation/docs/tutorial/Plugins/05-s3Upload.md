
> 🫸This plugin is under development and not yet released

# S3 Upload

This plugin allows you to upload files to Amazon S3 bucket.

## Usage

Add column to `aparts` resource configuration:

```ts title="./index.ts"
async function initDataBase() {
  ...
  // check column appartment_image in aparts table
  const columns = await db.prepare('PRAGMA table_info(aparts);').all();
  const columnExists = columns.some((c) => c.name === 'appartment_image');
  if (!columnExists) {
    await db.prepare('ALTER TABLE aparts ADD COLUMN appartment_image VARCHAR(255);').run();
  }
}

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'preview',
      ...
    }
    ...
  ],
  plugins: [
    new S3UploadPlugin({
      pathField: 'preview',
      s3Bucket: 'my-bucket',
      s3Region: 'us-east-1',
      s3AccessKeyId: 'my-access-key-id',
      s3SecretAccessKey: 'my-secret-access-key',
      s3ACL: 'public-read', // ACL which will be set to uploaded file
      s3Path: ({record, originalFilename}) => `/aparts/${record.id}/${originalFilename}`,

      // Used to display preview (if it is image) in list and show views
      previewUrl: ({record, path}) => `https://my-bucket.s3.amazonaws.com/${path}`,
  ...
}
```