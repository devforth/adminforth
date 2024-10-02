---
slug: ai-blog
title: Build blog with Copilot-alike AI assistant within a minutes
authors: ivanb
tags: [nuxt, chatgpt]
---

Many developers today are using copilots to write code much faster with less keystrokes. 

But what about writing plain text? For example blogs and micro-blogs? Sometimes you want to share your progress and thoughts but you are lazy for typing. AI can help you with it even better then in coding - you just make a first move it completes.

Here we will suggest you simple as 1-2-3 steps to build and host a blog with AI assistant which will help you to write posts.

Our tech stack will include:

- [Nuxt.js](https://nuxt.com/) - SEO-friendly page rendering framework
- [AdminForth](https://adminforth.dev/) - Admin panel framework for creating posts
- [AdminForth RichEditor plugin](https://adminforth.dev/docs/tutorial/Plugins/RichEditor/) - WYSIWYG editor with AI assistant in Copilot style
- Node and typescript
- Prisma for migrations

## Prerequirements

We will use Node v 20, if you not have it installed, please install it with [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script)

```bash
nvm install 20
nvm alias default 20
nvm use 20
```

## Step 1: Create a new AdminForth

```bash
mkdir ai-blog
cd ai-blog
npm init -y
npm install adminforth express @types/express typescript tsx @types/node --save-dev
npx --yes tsc --init --module ESNext --target ESNext
```

## Step 2: Prepare environment

### OpenAI

To allocate OpenAI API key, go to https://platform.openai.com/, open Dashboard -> API keys -> Create new secret key.

### S3

1. Go to https://aws.amazon.com and login.
2. Go to Services -> S3 and create a bucket. Put in bucket name e.g. `my-ai-blog-bucket`. 
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
            "http://localhost:3500"
        ],
        "ExposeHeaders": []
    }
]
```

> ☝️ In AllowedOrigins add all your domains. For example if you will serve blog and admin on `https://example.com/` you should add 
> `"https://example.com"` to AllowedOrigins:
>
> ```json
> [
>      "https://example.com",
>      "http://localhost:3500"
> ]
> ```
> Every character matters, so don't forget to add `http://` or `https://`!

4. Go to Services -> IAM and create a new user. Put in user name e.g. `my-ai-blog-bucket`.
5. Attach existing policies directly -> `AmazonS3FullAccess`. Go to your user -> `Add permissions` -> `Attach policies directly` -> `AmazonS3FullAccess`
6. Go to Security credentials and create a new access key. Save `Access key ID` and `Secret access key`.


### Create .env file in project directory

Create `.env` file with the following content:

```bash title=".env"
DATABASE_URL=file:./db.sqlite
ADMINFORTH_SECRET=123
NODE_ENV=development
# Your OpenAI API key for ChatGPT completions
OPENAI_API_KEY=...
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=my-ai-blog-bucket
AWS_S3_REGION=us-east-1
```


## Step 3: Initialize database

Create `./schema.prisma` and put next content there:


```yaml title="./schema.prisma" 
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String     @id
  createdAt    DateTime 
  email        String   @unique
  avatar       String?
  publicName   String?
  passwordHash String
  posts        Post[]
}

model Post {
  id          String     @id
  createdAt   DateTime 
  title       String
  slug        String
  picture     String?
  content     String
  published   Boolean  
  author      User?    @relation(fields: [authorId], references: [id])
  authorId    String?
  contentImages ContentImage[]
}

model ContentImage {
  id         String     @id
  createdAt  DateTime 
  img        String
  postId     String
  resourceId String
  post       Post      @relation(fields: [postId], references: [id])
}
```

Create database using `prisma migrate`:

```bash
npx -y prisma migrate dev --name init
```

## Step 4: Setting up AdminForth


Open `package.json`, set `type` to `module` and add `start` script:

```json title="./package.json"
{
  ...
//diff-add
  "type": "module",
  "scripts": {
    ...
//diff-add
    "start": "tsx watch --env-file=.env index.ts"
  },
}
```

Create `index.ts` file in root directory with following content:

```ts title="./index.ts"

```

## Step 5: Create resources

Create `users.res.ts` file in root directory with following content:

```ts title="./users.res.ts"

```


Create `posts.res.ts` file in root directory with following content:

```ts title="./posts.res.ts"


```




Init Nuxt project in `front` directory:

```bash
npx -y nuxi@latest init front
```