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
          enforceLowerCase: true,
          validation: [
            AdminForth.Utils.EMAIL_VALIDATOR,
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

  admin.express.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}\n`)
  });
}