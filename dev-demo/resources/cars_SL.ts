import { AdminForthDataTypes, AdminForthResourceInput } from 'adminforth';
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";

export default {
  dataSource: 'sqlite',
  table: 'cars',
  resourceId: 'cars_sl',
  label: 'Cars',
  recordLabel: (r) => `🚘 ${r.model} 🚗`,
  columns: [
    {
      name: 'id',
      type: AdminForthDataTypes.STRING,
      label: 'Identifier',
      showIn: {
        list: false,
        edit: false,
        create: false,
      },
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }) => Math.random().toString(36).substring(7),
    },
    {
      name: 'model',
      required: true,
      showIn: { all: true },
      type: AdminForthDataTypes.STRING,
      maxLength: 255,
      minLength: 3,
    },
    {
      name: 'price',
      inputSuffix: 'USD',
      allowMinMaxQuery: true,
      editingNote: 'Price is in USD',
      type: AdminForthDataTypes.FLOAT,
      required: true,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: { create: false },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'engine_type',
      type: AdminForthDataTypes.STRING,
      label: 'Engine Type',
      allowMinMaxQuery: true,
      enum: [
        { value: 'gasoline', label: 'Gasoline' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'electric', label: 'Electric' },
        { value: 'hybrid', label: 'Hybrid' },
      ],
    },
    {
      name: 'engine_power',
      allowMinMaxQuery: true,
      type: AdminForthDataTypes.INTEGER,
      inputSuffix: 'HP',
      showIf: { engine_type: { $not: 'electric' } },
      required: true,
    },
    {
      name: 'production_year',
      type: AdminForthDataTypes.INTEGER,
      minValue: 1900,
      maxValue: new Date().getFullYear(),
    },
    {
      name: 'description',
      type: AdminForthDataTypes.TEXT,
      sortable: false,
      showIn: { list: false },
    },
    {
      name: 'listed',
      required: true,
      type: AdminForthDataTypes.BOOLEAN,
    },
    {
      name: 'mileage',
      allowMinMaxQuery: true,
      type: AdminForthDataTypes.FLOAT,
    },
    {
      name: 'color',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'body_type',
      label: 'Body Type',
      enum: [
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV' },
        { value: 'hatchback', label: 'Hatchback' },
        { value: 'coupe', label: 'Coupe' },
        { value: 'convertible', label: 'Convertible' },
        { value: 'wagon', label: 'Wagon' },
        { value: 'van', label: 'Van' },
        { value: 'truck', label: 'Truck' },
      ],
    },
    {
      name: 'photos',
      type: AdminForthDataTypes.JSON,
      label: 'Photos',
      isArray: {
        enabled: true,
        itemType: AdminForthDataTypes.STRING,
      },
      showIn: { 
        list: false 
      },
    },
    {
      name: 'seller_id',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
        resourceId: 'adminuser',
        searchableFields: ["id", "email"],
      }
    }
  ],
  plugins: [
    new UploadPlugin({
      storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: "./sqlite/car_images",
        adminServeBaseUrl: "static/source",
        mode: "public",
        signingSecret: "TOP_SECRET",
      }),
      pathColumnName: 'photos',
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webm', 'webp'],
      maxFileSize: 1024 * 1024 * 20, // 20 MB
      filePath: ({originalFilename, originalExtension, contentType}) => 
            `cars/${originalFilename}.${originalExtension}`,
      preview: {
        maxShowWidth: "300px",
        previewUrl: ({filePath}) => `/static/source/${filePath}`,
      },
    })
  ],
  options: {
    listPageSize: 12,
    allowedActions: {
      edit: true,
      delete: true,
      show: true,
      filter: true,
    },
  },
} as AdminForthResourceInput;