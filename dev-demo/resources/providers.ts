import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth";
import ImportExport from "../../plugins/adminforth-import-export";
import InlineCreatePlugin from "../../plugins/adminforth-inline-create";
import InplaceEdit from "../../plugins/adminforth-list-in-place-edit";
import ImportExportPlugin from "../../plugins/adminforth-import-export";
import { v1 as uuid } from "uuid";

export default {
  dataSource: 'maindb',
  table: 'providers',
  resourceId: 'providers',
  label: 'Providers',
  recordLabel: (r: any) => `👨‍⚕️ ${r.name}`,
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
  ],
  plugins: [
    // new InlineCreatePlugin({}),
    // new InplaceEdit({
    //   columns: ['name'],
    // }),
    new ImportExportPlugin({
    }),
  ],
  options: {},
} as AdminForthResourceInput;