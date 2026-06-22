import { AdminForthDataTypes, type AdminForthResourceInput } from 'adminforth';
import { randomUUID } from 'crypto';

export default {
  dataSource: 'sqlite',
  table: 'AdminUserExternalIdentity',
  resourceId: 'admin_user_external_identities',
  label: 'Admin User External Identities',
  columns: [
    {
      name: 'id',
      type: AdminForthDataTypes.STRING,
      primaryKey: true,
      fillOnCreate: () => randomUUID(),
      showIn: { create: false, edit: false },
    },
    { name: 'adminUserId', type: AdminForthDataTypes.STRING, required: true },
    { name: 'provider', type: AdminForthDataTypes.STRING, required: true },
    { name: 'subject', type: AdminForthDataTypes.STRING, required: true },
    { name: 'externalUserId', type: AdminForthDataTypes.STRING },
    { name: 'email', type: AdminForthDataTypes.STRING },
    { name: 'phone', type: AdminForthDataTypes.STRING },
    { name: 'fullName', type: AdminForthDataTypes.STRING },
    { name: 'avatarUrl', type: AdminForthDataTypes.STRING },
    { name: 'meta', type: AdminForthDataTypes.JSON },
    {
      name: 'createdAt',
      type: AdminForthDataTypes.DATETIME,
      fillOnCreate: () => new Date().toISOString(),
      showIn: { create: false, edit: false },
    },
  ],
} satisfies AdminForthResourceInput;