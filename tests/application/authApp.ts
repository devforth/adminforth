import express from 'express';
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import { randomUUID } from 'node:crypto';

/**
 * Minimal application used by auth tests: it holds only the users resource, so login behaviour
 * is tested without plugins of the main test application.
 */
export const admin = new AdminForth({
  baseUrl: '',
  auth: {
    usersResourceId: 'adminuser',
    usernameField: 'email',
    passwordHashField: 'password_hash',
  },
  dataSources: [
    {
      id: 'sqlite',
      url: `${process.env.SQLITE_URL}`,
    },
  ],
  resources: [
    {
      dataSource: 'sqlite',
      table: 'adminuser',
      resourceId: 'adminuser',
      label: 'Users',
      columns: [
        {
          name: 'id',
          primaryKey: true,
          fillOnCreate: () => randomUUID(),
          showIn: { create: false, edit: false },
        },
        {
          name: 'email',
          required: true,
          isUnique: true,
          normalize: (value: string) => value.trim().toLowerCase(),
        },
        {
          name: 'created_at',
          type: AdminForthDataTypes.DATETIME,
          fillOnCreate: () => new Date().toISOString(),
          showIn: { create: false, edit: false },
        },
        { name: 'role' },
        { name: 'password_hash', backendOnly: true, showIn: { all: false } },
      ],
    },
  ],
  menu: [
    {
      label: 'Users',
      resourceId: 'adminuser',
    },
  ],
});

const app = express();
app.use(express.json());

admin.express.serve(app);

const appReady = admin.discoverDatabases().then(async () => {
  if (await admin.resource('adminuser').count() === 0) {
    await admin.resource('adminuser').create({
      email: 'adminforth',
      password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
      role: 'superadmin',
    });
  }
});

async function closeApplication() {
  await Promise.all(Object.values(admin.connectors).map(async (connector: any) => {
    if (typeof connector?.close === 'function') {
      await connector.close();
    }
  }));
}

export { app, appReady, closeApplication };
