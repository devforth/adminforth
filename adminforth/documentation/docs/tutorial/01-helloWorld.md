
# Hello world app

No water. Pure code to get started ASAP.

Here we create database with users and posts tables and admin panel for it. 

Users table will be used to store a credentials for login into admin panel itself.

When back-office user creates a new post it will be automatically assigned using `authorId` to the user who created it.

## Prerequisites

We will use Node v20 for this demo. If you have other Node versions, we recommend using [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) to switch them easily:

```bash
nvm install 20
nvm alias default 20
nvm use 20
```

## Installation

```bash
mkdir af-hello
cd af-hello
npm init -y
npm install adminforth express@4 typescript tsx @types/node --save-dev
npx --yes tsc --init
```

## Env variables

Create `.env` file in root directory and put following content:

```bash title="./.env"
DATABASE_URL="file:./db.sqlite"
DATABASE_FILE_URL=file:${DATABASE_FILE}
ADMINFORTH_SECRET=123
NODE_ENV=development
```

> ☝️ Production best practices:
> 1) Most likely you not need `.env` file at all, instead you should use environment variables (from Docker, Kubernetes, Operating System, etc.)
> 2) You should set `NODE_ENV` to `production` so it will not waste extra resources on hot reload.
> 3) You should generate very unique value `ADMINFORTH_SECRET` and store it in Vault or other secure place.


> ☝️ If you are using Git, obviously you should make sure you will never commit `.env` file to the repository, because
it might contain your own sensitive secrets. So to follow best practices, we recommend to add `.env` into `.gitignore` and create `.env.sample` as template for other repository users with demo data.

## Database creation

> ☝️ For demo purposes we will create a database using Prisma and SQLite. 
> You can also create it using any other favorite tool or ORM and skip this step.


Create `./schema.prisma` and put next content there:

```text title="./schema.prisma"
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_FILE_URL")
}

model User {
  id           String     @id
  createdAt    DateTime 
  email        String   @unique
  role         String     
  passwordHash String
  posts        Post[]
}

model Post {
  id        String     @id
  createdAt DateTime 
  title     String
  content   String?
  published Boolean  
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  String?
}

```

Create database using `prisma migrate`:

```bash
npx --yes prisma migrate dev --name init
```

## Setting up adminforth

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
import express from 'express';
import AdminForth, { AdminForthDataTypes, AdminUser, Filters } from 'adminforth';

export const admin = new AdminForth({
  baseUrl: '',
  auth: {
    usersResourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'passwordHash',
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY HH:mm:ss',
    emptyFieldPlaceholder: '-',
  },
  dataSources: [{
    id: 'maindb',
    url: `sqlite://${process.env.DATABASE_FILE}`,
  }],
  resources: [
    {
      dataSource: 'maindb',
      table: 'user',
      resourceId: 'users',
      label: 'Users',
      recordLabel: (r: any) => `👤 ${r.email}`,
      columns: [
        {
          name: 'id',
          primaryKey: true,
          fillOnCreate: () => Math.random().toString(36).substring(7),
          showIn: ['list', 'filter', 'show'],
        },
        {
          name: 'email',
          required: true,
          isUnique: true,
          validation: [
            {
              regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              message: 'Email is not valid, must be in format aa@bb@cc',
            },
          ]
        },
        {
          name: 'createdAt',
          type: AdminForthDataTypes.DATETIME,
          showIn: ['list', 'filter', 'show'],
          fillOnCreate: () => (new Date()).toISOString(),
        },
        {
          name: 'role',
          enum: [
            { value: 'superadmin', label: 'Super Admin' },
            { value: 'user', label: 'User' },
          ]
        },
        {
          name: 'password',
          virtual: true,
          required: { create: true },
          editingNote: { edit: 'Leave empty to keep password unchanged' },
          minLength: 8,
          type: AdminForthDataTypes.STRING,
          showIn: ['create', 'edit'],
          masked: true,
        },
        { name: 'passwordHash', backendOnly: true, showIn: [] }
      ],
    },
    {
      table: 'post',
      resourceId: 'posts',
      dataSource: 'maindb',
      label: 'Posts',
      recordLabel: (r: any) => `📝 ${r.title}`,
      columns: [
        {
          name: 'id',
          primaryKey: true,
          fillOnCreate: () => Math.random().toString(36).substring(7),
          showIn: ['list', 'filter', 'show'],
        },
        {
          name: 'title',
          type: AdminForthDataTypes.STRING,
          required: true,
          showIn: ['list', 'create', 'edit', 'filter', 'show'],
          maxLength: 255,
          minLength: 3,
        },
        {
          name: 'content',
          showIn: ['list', 'create', 'edit', 'filter', 'show'],
        },
        {
          name: 'createdAt',
          showIn: ['list', 'filter', 'show',],
          fillOnCreate: () => (new Date()).toISOString(),
        },
        {
          name: 'published',
          required: true,
        },
        {
          name: 'authorId',
          foreignResource: {
            resourceId: 'users',
          },
          showIn: ['list', 'filter', 'show'],
          fillOnCreate: ({ adminUser }: { adminUser: AdminUser }) => {
            return adminUser.dbUser.id;
          }
        }
      ],
    }
  ],
  menu: [
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          homepage: true,
          label: 'Posts',
          icon: 'flowbite:home-solid',
          resourceId: 'posts',
        },
      ]
    },
    { type: 'gap' },
    { type: 'divider' },
    { type: 'heading', label: 'SYSTEM' },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    }
  ],
});


if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start

  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' });
  console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

  // serve after you added all api
  admin.express.serve(app)

  admin.discoverDatabases().then(async () => {
    if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
      await admin.resource('users').create({
        email: 'adminforth',
        passwordHash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });

  app.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}\n`)
  });
}
```

> ☝️ For simplicity we defined whole configuration in one file. Normally once configuration grows you should 
> move each resource configuration to separate file and organize them to folder and import them in `index.ts`.

Now you can run your app:

```bash
npm start
```

Open http://localhost:3500 in your browser and login with credentials `adminforth` / `adminforth`.


![alt text](localhost_3500_login.png)



## Possible configuration options

Check [AdminForthConfig](/docs/api/types/AdminForthConfig/type-aliases/AdminForthConfig.md) for all possible options.