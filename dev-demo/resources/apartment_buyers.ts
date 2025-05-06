import AdminForth, {
  AdminForthDataTypes,
  AdminForthResourcePages,
  AdminForthResource,
  AdminForthResourceColumn,
  AdminForthResourceInput,
  AdminUser,
} from "../../adminforth";
import { v1 as uuid } from "uuid";
// import RichEditorPlugin from "../../plugins/adminforth-rich-editor";

export default {
  dataSource: 'mysql',
  table: 'apartment_buyers',
  /*
    To create table run SQL in MySQL Workbench or similar tool:
    CREATE TABLE apartment_buyers (
      id VARCHAR(255) NOT NULL,
      created_at DATETIME,
      name VARCHAR(255) NOT NULL,
      age INT UNSIGNED,
      gender ENUM('m', 'f'),
      info LONGTEXT,
      contact_info JSON,
      language CHAR(2),
      ideal_price DECIMAL(65, 2),
      ideal_space FLOAT(24),
      ideal_subway_distance FLOAT(53),
      contacted BOOL NOT NULL,
      contact_date DATE,
      contact_time TIME,
      realtor_id VARCHAR(255),
      PRIMARY KEY (id)
    ); 
   */
  resourceId: 'apartment_buyers',
  label: 'Potential Buyers',
  recordLabel: (r: any) => `👤 ${r.name}`,
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
      name: "created_at",
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: {
        [AdminForthResourcePages.create]: false,
      },
      components: {
        list: "@/renderers/RelativeTime.vue",
      },
      fillOnCreate: ({ initialRecord, adminUser }: any) => new Date().toISOString(),
    },
    {
      name: 'name',
      required: true,
      maxLength: 255,
    },
    {
      name: 'age',
      type: AdminForthDataTypes.INTEGER,
      minValue: 18,
    },
    {
      name: 'gender',
      enum: [
        {
          value: 'm',
          label: 'Male',
        },
        {
          value: 'f',
          label: 'Female',
        },
        {
          value: null,
          label: 'Unknown',
        },
      ],
    },
    {
      name: 'language',
      enum: [
        { value: 'en', label: 'English' },
        { value: 'uk', label: 'Ukrainian' },
        { value: 'fr', label: 'French' },
        { value: 'es', label: 'Spanish' },
      ],
    },
    {
      name: 'info',
      sortable: false,
      type: AdminForthDataTypes.TEXT,
      showIn: { list: false },
      components: {
        show: "@/renderers/RichText.vue",
      },
    },
    {
      name: 'contact_info',
      sortable: false,
      type: AdminForthDataTypes.JSON,
      showIn: { list: false },
    },
    {
      name: 'ideal_price',
      type: AdminForthDataTypes.DECIMAL,
      showIn: { list: false },
    },
    {
      name: 'ideal_space',
      type: AdminForthDataTypes.FLOAT,
      showIn: { list: false },
    },
    {
      name: 'ideal_subway_distance',
      type: AdminForthDataTypes.FLOAT,
      showIn: { list: false },
    },
    {
      name: 'contacted',
      type: AdminForthDataTypes.BOOLEAN,
      required: true,
    },
    {
      name: 'contact_date',
      type: AdminForthDataTypes.DATE,
      showIn: { list: false },
    },
    {
      name: 'contact_time',
      type: AdminForthDataTypes.TIME,
      showIn: { list: false },
    },
    {
      name: 'realtor_id',
      foreignResource: {
        resourceId: 'users',
      },
    },
  ],
  plugins: [
    // new RichEditorPlugin({
    //   htmlFieldName: 'info',
    // }),
  ],
  options: {
    fieldGroups: [
      {
        groupName: "Personal Information",
        columns: ["name", "age", "gender", "language", "info", "contact_info"],
      },
      {
        groupName: "Preferences",
        columns: [
          "ideal_price",
          "ideal_space",
          "ideal_subway_distance",
        ],
      },
      {
        groupName: "Realtor Related Information",
        columns: ["contacted", "contact_date", "contact_time", "realtor_id"],
      },
      {
        groupName: "System Information",
        columns: ["id", "created_at"],
      },
    ],
  },
} as AdminForthResourceInput;