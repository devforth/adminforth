---
id: hello-world
title: Hello world app without CLI
sidebar_class_name: hidden-sidebar
---

# Hello world app without CLI

While AdminForth CLI is the fastest way to create a new project, you can also create a new project manually.

This might help you better understand how AdminForth project is structured and how to customize it.

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
npm i adminforth express @types/express typescript tsx @types/node -D
npx --yes tsc --init --module NodeNext --target ESNext
```

## Environment variables

Create two files in your project's root directory:

- `.env.local` — Place your non-sensitive environment variables here (e.g., local database paths, default configurations). This file can be safely committed to your repository as a demo or template configuration.
- `.env` — Store sensitive tokens and secrets here (for example, `ADMINFORTH_SECRET` and other private keys). Ensure that `.env` is added to your `.gitignore` to prevent accidentally committing sensitive data.

Put the following content to the `.env.local` file:

```bash title="./.env.local"
ADMINFORTH_SECRET=123
NODE_ENV=development
DATABASE_FILE=../db.sqlite
DATABASE_FILE_URL=file:${DATABASE_FILE}
```

> ☝️ Production best practices:
>
> 1) Most likely you not need `.env` file at all, instead you should use environment variables (from Docker, Kubernetes, Operating System, etc.)
> 2) Set `NODE_ENV` to `production` in your deployment environment to optimize performance and disable development features like hot reloading.
> 3) You should generate very unique value `ADMINFORTH_SECRET` and store it in Vault or other secure place.

## Setting up the scripts

Open `package.json` and add the following scripts:

```json title="./package.json"
{
  ...
//diff-add
  "type": "module",
  "scripts": {
    ...
//diff-add
    "env": "dotenvx run -f .env.local -f .env --overload --",
//diff-add
    "start": "npm run env -- tsx watch index.ts",
//diff-add
    "migrateLocal": "npm run env -- npx prisma migrate deploy",
//diff-add
    "makemigration": "npm run env -- npx --yes prisma migrate deploy; npm run env -- npx --yes prisma migrate dev",
  },
}
```

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
npm run makemigration --name init ; npm run migrate:local
```

## Setting up AdminForth

Create `index.ts` file in root directory with following content:

```ts title="./index.ts"
import express from 'express';
import AdminForth, { AdminForthDataTypes, Filters, logger } from 'adminforth';
import type { AdminForthResourceInput, AdminForthResource, AdminUser } from 'adminforth';

export const admin = new AdminForth({
  baseUrl: '',
  auth: {
    usersResourceId: 'adminuser',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'passwordHash',
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY',
    timeFormat: 'HH:mm:ss',
    emptyFieldPlaceholder: '-',
  },
  dataSources: [{
    id: 'maindb',
    url: `sqlite://${process.env.DATABASE_FILE}`,
  }],
  resources: [
    {
      dataSource: 'maindb',
      table: 'adminuser',
      resourceId: 'adminuser',
      label: 'Users',
      recordLabel: (r: any) => `👤 ${r.email}`,
      columns: [
        {
          name: 'id',
          primaryKey: true,
          fillOnCreate: () => Math.random().toString(36).substring(7),
          showIn: {
            edit: false,
            create: false,
          },
        },
        {
          name: 'email',
          required: true,
          isUnique: true,
          enforceLowerCase: true,
          validation: [
            AdminForth.Utils.EMAIL_VALIDATOR,
          ]
        },
        {
          name: 'createdAt',
          type: AdminForthDataTypes.DATETIME,
          showIn: {
            edit: false,
            create: false,
          },
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
          showIn: {
            show: false,
            list: false,
            filter: false,
          },
          masked: true,
        },
        { name: 'passwordHash', backendOnly: true, showIn: { all: false } }
      ],
      hooks: {
        create: {
          beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
            record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            return { ok: true };
          }
        },
        edit: {
          beforeSave: async ({ oldRecord, updates, adminUser, resource }: { oldRecord: any, updates: any, adminUser: AdminUser, resource: AdminForthResource }) => {
            logger.info('Updating user', updates);
            if (oldRecord.id === adminUser.dbUser.id && updates.role) {
              return { ok: false, error: 'You cannot change your own role' };
            }
            if (updates.password) {
              updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
            }
            return { ok: true }
          },
        },
      }
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
          showIn: {
            edit: false,
            create: false,
          },
        },
        {
          name: 'title',
          type: AdminForthDataTypes.STRING,
          required: true,
          showIn: { all: true },
          maxLength: 255,
          minLength: 3,
        },
        {
          name: 'content',
          showIn: { all: true },
        },
        {
          name: 'createdAt',
          showIn: {
            edit: false,
            create: false,
          },
          fillOnCreate: () => (new Date()).toISOString(),
        },
        {
          name: 'published',
          required: true,
        },
        {
          name: 'authorId',
          foreignResource: {
            resourceId: 'adminuser',
          },
          showIn: {
            edit: false,
            create: false,
          },
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
      resourceId: 'adminuser',
    }
  ],
});


if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start

  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development' }).then(() => {
    logger.info('Bundling AdminForth SPA done.');
  });

  // serve after you added all api
  admin.express.serve(app)

  admin.discoverDatabases().then(async () => {
    if (await admin.resource('adminuser').count() === 0) {
      await admin.resource('adminuser').create({
        email: 'adminforth',
        passwordHash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });

  admin.express.listen(port, () => {
    logger.info(`\n⚡ AdminForth is available at http://localhost:${port}\n`)
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

## Initializing custom directory

If you are not using CLI, you can create `custom` directory and initialize it with `npm`:

```bash
cd ./custom
npm init -y
```

We will use this directory for all custom components. If you want to call your dir with other name then `custom`, just set [customComponentsDir option](/docs/api/Back/interfaces/AdminForthConfigCustomization/#customcomponentsdir)


Also, for better development experience we recommend to create file `custom/tsconfig.json` with the following content:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "../node_modules/adminforth/dist/spa/src/*"
      ],
      "*": [
        "../node_modules/adminforth/dist/spa/node_modules/*"
      ],
      "@@/*": [
        "."
      ]
    }
  }
}
```

## Possible configuration options

Check [AdminForthConfig](/docs/api/Back/interfaces/AdminForthConfig.md) for all possible options.
