import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";
import { v1 as uuid } from "uuid";

export default {
  dataSource: 'maindb',
  table: 'api_keys',
  resourceId: 'api_keys',
  label: 'API Keys',
  recordLabel: (r: any) => `🔑 ${r.name}`,
  columns: [
    {
      name: 'id',
      label: 'ID',
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => uuid(),
      showIn: {
        create: false,
        edit: false,
      },
      components: {
        list: "@/renderers/CompactUUID.vue",
      },
    },
    {
      name: 'name',
      type: AdminForthDataTypes.STRING,
      required: true,
      maxLength: 255,
    },
    {
      name: 'owner',
      type: AdminForthDataTypes.STRING,
      enum: [
        {
          value: 'clinic',
          label: 'Clinic',
        },
        {
          value: 'provider',
          label: 'Provider',
        },
      ],
      showIn: { create: false, edit: false },
    },
    {
      name: 'owner_id',
      foreignResource: {
        polymorphicResources: [
          {
            resourceId: 'clinics',
            whenValue: 'clinic',
          },
          {
            resourceId: 'providers',
            whenValue: 'provider',
          },
          {
            resourceId: null,
            whenValue: 'Syst1em',
          },
        ],
        polymorphicOn: 'owner',
      },
    },
  ],
  plugins: [],
  options: {},
} as AdminForthResourceInput;