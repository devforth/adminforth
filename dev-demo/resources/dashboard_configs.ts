import { randomUUID } from 'crypto';
import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'sqlite',
  table: 'dashboard_configs',
  resourceId: 'dashboard_configs',
  label: 'Dashboard Configs',
  recordLabel: (record) => record.label,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: () => randomUUID(),
      showIn: {
        list: false,
        edit: false,
        create: false,
        show: true,
        filter: false,
      },
    },
    {
      name: 'slug',
      type: AdminForthDataTypes.STRING,
      label: 'Slug',
    },
    {
      name: 'label',
      type: AdminForthDataTypes.STRING,
      label: 'Label',
    },
    {
      name: 'revision',
      type: AdminForthDataTypes.INTEGER,
      label: 'Revision',
      fillOnCreate: () => 1,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'config',
      type: AdminForthDataTypes.JSON,
      label: 'Config',
    },
  ],
} as AdminForthResourceInput;