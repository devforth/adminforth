import express from 'express';
import AdminForth, { Filters } from 'adminforth';
import usersResource from "./resources/users";
import apartmentsResource from "./resources/apartments";
import auditLogsResource from "./resources/auditLogs"


const ADMIN_BASE_URL = '';

export const admin = new AdminForth({
  baseUrl : ADMIN_BASE_URL,
  auth: {
    usersResourceId: 'users',  // resource to get user during login
    usernameField: 'email',  // field where username is stored, should exist in resource
    passwordHashField: 'password_hash',
    rememberMeDays: 30, // users who will check "remember me" will stay logged in for 30 days
  },
  customization: {
    brandName: 'My Admin',
    datesFormat: 'D MMM YY',
    timeFormat: 'HH:mm:ss',
    emptyFieldPlaceholder: '-',
  },
  dataSources: [
    {
      id: 'maindb',
      url: `sqlite://${process.env.DATABASE_FILE}`
    },
  ],
  resources: [
    apartmentsResource,
    usersResource,
    auditLogsResource
  ],
  menu: [
    {
      label: 'Core',
      icon: 'flowbite:brain-solid', // any icon from iconify supported in format <setname>:<icon>, e.g. from here https://icon-sets.iconify.design/flowbite/
      open: true,
      children: [
        {
          homepage: true,
          label: 'Apartments',
          icon: 'flowbite:home-solid',
          resourceId: 'aparts',
        },
        {
          label: 'Audit Logs',
          icon: 'flowbite:search-outline',
          resourceId: 'audit_logs',
        }
      ]
    },
    {
      type: 'gap'
    },
    {
      type: 'divider'
    },
    {
      type: 'heading',
      label: 'SYSTEM',
    },
    {
      label: 'Users',
      icon: 'flowbite:user-solid',
      resourceId: 'users',
    }
  ],
});

async function seedDatabase() {
  if (await admin.resource('aparts').count() > 0) {
    return
  }
  for (let i = 0; i <= 50; i++) {
    await admin.resource('aparts').create({
      id: `${i}`,
      title: `Apartment ${i}`,
      square_meter: (Math.random() * 100).toFixed(1),
      price: (Math.random() * 10000).toFixed(2),
      number_of_rooms: Math.floor(Math.random() * 4) + 1,
      description: 'Next gen apartments',
      created_at: (new Date(Date.now() - Math.random() * 60 * 60 * 24 * 14 * 1000)).toISOString(),
      listed: i % 2 == 0,
      country: `${['US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA'][Math.floor(Math.random() * 10)]}`
    });
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  // if script is executed directly e.g. node index.ts or npm start


  const app = express()
  app.use(express.json());
  const port = 3500;

  // needed to compile SPA. Call it here or from a build script e.g. in Docker build time to reduce downtime
  admin.bundleNow({ hotReload: process.env.NODE_ENV === 'development'}).then(() => {
    console.log('Bundling AdminForth done. For faster serving consider calling bundleNow() from a build script.');
  })


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
    await seedDatabase();
  });

  admin.express.expressApp.listen(port, () => {
    console.log(`\n⚡ AdminForth is available at http://localhost:${port}${ADMIN_BASE_URL}\n`)
  });
}