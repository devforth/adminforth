
> 🫸This plugin is under development and not yet released

# S3 Upload

This plugin allows you to upload files to Amazon S3 bucket.

## Usage

Add column to `aparts` resource configuration:

```ts title="./index.ts"
async function initDataBase() {
  ...
  // check column appartment_image in apartments table
  const columns = await db.prepare('PRAGMA table_info(apartments);').all();
  const columnExists = columns.some((c) => c.name === 'appartment_image');
  if (!columnExists) {
    await db.prepare('ALTER TABLE apartments ADD COLUMN appartment_image VARCHAR(255);').run();
  }
}

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'appartment_image',
      showIn: ['list', 'show'], // if you will try to show it in edit/create view, plugin will disable it anyway
      ...
    }
    ...
  ],
  plugins: [
    new S3UploadPlugin({
      pathColumnName: 'appartment_image',
      uploadColumnLabel: 'Upload preview', // label of upload field
      s3Bucket: 'my-bucket',
      s3Region: 'us-east-1',
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3ACL: 'public-read', // ACL which will be set to uploaded file
      s3Path: ({originalFilename, originalExtension, contentType}) => `/aparts/${new Date().getFullYear()}/${uuid()}.${originalExtension}`,

      // Used to display preview (if it is image) in list and show views
      // previewUrl: ({record, path}) => `https://my-bucket.s3.amazonaws.com/${path}`,
  ...
}
```