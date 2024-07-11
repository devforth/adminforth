
> 🫸This plugin is under development and not yet released

# Upload

This plugin allows you to upload files to Amazon S3 bucket.

## Usage

Add column to `aparts` resource configuration:

```ts title="./index.ts"

export const admin = new AdminForth({
  ...
  resourceId: 'aparts',
  columns: [
    ...
//diff-add
    {
//diff-add
      name: 'appartment_image',
//diff-add
      showIn: ['list', 'show'], // if you will try to show it in edit/create view, plugin will disable it anyway
//diff-add
    }
    ...
  ],
  plugins: [
    ...
//diff-add
    new S3UploadPlugin({
//diff-add
      pathColumnName: 'appartment_image',
//diff-add
      uploadColumnLabel: 'Upload preview', // label of upload field
//diff-add
      s3Bucket: 'my-bucket',
//diff-add
      s3Region: 'us-east-1',
//diff-add
      s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
//diff-add
      s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//diff-add
      s3ACL: 'public-read', // ACL which will be set to uploaded file
//diff-add
      s3Path: ({originalFilename, originalExtension, contentType}) => `/aparts/${new Date().getFullYear()}/${uuid()}.${originalExtension}`,
//diff-add
      // You can use next to change preview URLs (if it is image) in list and show views
//diff-add
      // previewUrl: ({record, path}) => `https://my-bucket.s3.amazonaws.com/${path}`,
//diff-add
    })
  ]
  
  ...

});

async function initDataBase() {
  ...
//diff-add
  // check column appartment_image in apartments table
//diff-add
  const columns = await db.prepare('PRAGMA table_info(apartments);').all();
//diff-add
  const columnExists = columns.some((c) => c.name === 'appartment_image');
//diff-add
  if (!columnExists) {
//diff-add
    await db.prepare('ALTER TABLE apartments ADD COLUMN appartment_image VARCHAR(255);').run();
//diff-add
  }
}
```