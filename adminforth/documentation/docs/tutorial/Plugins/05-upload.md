
> 🫸This plugin is under development and not yet released

# Upload

This plugin allows you to upload files to Amazon S3 bucket.

## S3

1. Go to https://aws.amazon.com and login.
2. Go to Services -> S3 and create a bucket. Put in bucket name e.g. `my-reality-bucket`. 
Leave all settings unchanged (ACL Disabled, Block all public access - checked)
3. Go to bucket settings, Permissions, scroll down to Cross-origin resource sharing (CORS) and put in the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT"
        ],
        "AllowedOrigins": [
            "http://localhost:3000"
        ],
        "ExposeHeaders": []
    }
]
```

> 🫨 In AllowedOrigins add all your domains. For example if you will searve adming on `https://example.com/admin` you should add 
> `"https://example.com"` to AllowedOrigins:
>
> ```json
> [
>      "https://example.com",
>      "http://localhost:3000"
> ]
> ```
> Every character matters, so don't forget to add `http://` or `https://`!

4. Go to Services -> IAM and create a new user. Put in user name e.g. `my-reality-user`.
5. Attach existing policies directly -> `AmazonS3FullAccess`.
6. Go to Security credentials and create a new access key. Save `Access key ID` and `Secret access key`.
7. Add credentials in your `.env` file:

```bash title=".env"
...
NODE_ENV=development 
//diff-add
AWS_ACCESS_KEY_ID=your_access_key_id
//diff-add
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```


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