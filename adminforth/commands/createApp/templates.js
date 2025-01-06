export function gitignore() {
  return `# Dependency directories
node_modules/

# dotenv environment variable files
.env
`;
}

export function env(dbUrl, prismaDbUrl) {
  const base = `
ADMINFORTH_SECRET=123
NODE_ENV=development
DATABASE_URL=${dbUrl}
`
  if (prismaDbUrl)
    return base + `PRISMA_DATABASE_URL=${prismaDbUrl}`;
  return base;
}

export function envSample(dbUrl, prismaDbUrl) {
  return env(dbUrl, prismaDbUrl);
}

export function indexTs(appName) {
  return `import express from 'express';
import AdminForth, { Filters } from 'adminforth';
import usersResource from "./resources/users";

const ADMIN_BASE_URL = '';

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  auth: {
    usersResourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'password_hash',
    rememberMeDays: 30, // users who will check "remember me" will stay logged in for 30 days
    loginBackgroundImage: 'https://images.unsplash.com/photo-1534239697798-120952b76f2b?q=80&w=3389&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundPosition: '1/2', // over, 3/4, 2/5, 3/5 (tailwind grid)
    demoCredentials: "adminforth:adminforth",  // never use it for production
    loginPromptHTML: "Use email <b>adminforth</b> and password <b>adminforth</b> to login",
  },
  customization: {
    brandName: '${appName}',
    title: '${appName}',
    favicon: '@@/assets/favicon.png',
    brandLogo: '@@/assets/logo.svg',
    datesFormat: 'DD MMM',
    timeFormat: 'HH:mm a',
    showBrandNameInSidebar: true,
    styles: {
      colors: {
        light: {
          // color for links, icons etc.
          primary: '#B400B8',
          // color for sidebar and text
          sidebar: {main:'#571E58', text:'white'},
        },
        dark: {
          primary: '#82ACFF',
          sidebar: {main:'#1f2937', text:'#9ca3af'},
        }
      }
    },
  },
  dataSources: [
    {
      id: 'maindb',
      url: \`\${process.env.DATABASE_URL}\`
    },
  ],
  resources: [
    usersResource,
  ],
  menu: [
    {
      type: 'heading',
      label: 'SYSTEM',
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      resourceId: 'users',
    }
  ],
});

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  // if script is executed directly e.g. node index.ts or npm start

  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  await admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'});
  console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');

  // serve after you added all api
  admin.express.serve(app)

  admin.discoverDatabases().then(async () => {
    if (!await admin.resource('users').get([Filters.EQ('email', 'adminforth')])) {
      await admin.resource('users').create({
        email: 'adminforth',
        password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });

  admin.express.listen(port, () => {
    console.log(\`Example app listening at http://localhost:\${port}\`)
    console.log(\`\\n⚡ AdminForth is available at http://localhost:\${port}\${ADMIN_BASE_URL}\n\`)
  });
}
`;
}

export function schemaPrisma(provider, dbUrl) {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("PRISMA_DATABASE_URL")
}

model adminuser {
  id            String     @id
  email         String     @unique
  password_hash String
  role          String
  created_at    DateTime
}
`;
}

export function usersResource() {
  return `import AdminForth, { AdminForthDataTypes, AdminForthResourceInput } from 'adminforth';
import type { AdminUser } from  'adminforth';

async function canModifyUsers({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'maindb',
  table: 'adminuser',
  resourceId: 'users',
  label: 'Users',
  recordLabel: (r) => \`👤 \${r.email}\`,
  options: {
    allowedActions: {
      edit: canModifyUsers,
      delete: canModifyUsers,
    },
  },
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: ({ initialRecord, adminUser }) => Math.random().toString(36).substring(7),
      showIn: ['list', 'filter', 'show'],
    },
    {
      name: 'email',
      required: true,
      isUnique: true,
      type: AdminForthDataTypes.STRING,
      validation: [
        // you can also use AdminForth.Utils.EMAIL_VALIDATOR which is alias to this object
        {
          regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'Email is not valid, must be in format example@test.com'
        },
      ]
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: ['list', 'filter', 'show'],
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'role',
      type: AdminForthDataTypes.STRING,
      enum: [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'user', label: 'User' },
      ]
    },
    {
      name: 'password',
      virtual: true,  // field will not be persisted into db
      required: { create: true }, // make required only on create page
      editingNote: { edit: 'Leave empty to keep password unchanged' },
      type: AdminForthDataTypes.STRING,
      showIn: ['create', 'edit'], // to show field only on create and edit pages
      masked: true, // to show stars in input field

      minLength: 8,
      validation: [
        // request to have at least 1 digit, 1 upper case, 1 lower case
        AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM,
      ],
    },
    {
      name: 'password_hash',
      type: AdminForthDataTypes.STRING,
      backendOnly: true,
      showIn: []
    }
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }) => {
        record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        return { ok: true };
      }
    },
    edit: {
      beforeSave: async ({ record, adminUser, resource }) => {
        if (record.password) {
          record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        }
        return { ok: true }
      },
    },
  }
} as AdminForthResourceInput;
`;
}

/**
 * Root package.json template
 */
export function rootPackageJson(appName) {
  // Note: you might want to keep versions in sync or fetch from a config
  return `{
  "name": "${appName}",
  "version": "1.0.0",
  "main": "index.ts",
  "type": "module",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "scripts": {
    "start": "tsx watch --env-file=.env index.ts",
    "migrate": "npx prisma migrate deploy",
    "makemigration": "npx --yes prisma migrate deploy; npx --yes prisma migrate dev",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "adminforth": "latest",
    "express": "latest"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "tsx": "4.11.2",
    "@types/express": "latest",
    "@types/node": "latest",
    "@prisma/client": "latest",
    "prisma": "latest"
  }
}
`;
}

/**
 * Root tsconfig.json template
 */
export function rootTsConfig() {
  return `{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true
  },
  "exclude": ["node_modules", "dist"]
}
`;
}

/**
 * custom/package.json
 */
export function customPackageJson(appName) {
  return `{
  "name": "custom",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": ""
}
`;
}

/**
 * custom/tsconfig.json
 */
export function customTsconfig() {
  return `{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/": "../node_modules/adminforth/dist/spa/src/",
            "": "../node_modules/adminforth/dist/spa/node_modules/",
            "@@/*": "."
        }
    }
}
`;
}
