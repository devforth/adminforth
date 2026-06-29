import { randomUUID } from 'crypto';
import { AdminForthDataTypes, type AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'sqlite',
  table: 'cars_description_image',
  resourceId: 'polymorphic_car_refs',
  label: 'Polymorphic car refs',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      required: false,
      fillOnCreate: () => randomUUID(),
      showIn: {
        create: false,
      },
    },
    {
      name: 'created_at',
      required: false,
      fillOnCreate: () => new Date().toISOString(),
      showIn: {
        create: false,
      },
    },
    {
      name: 'resource_id',
      type: AdminForthDataTypes.STRING,
      required: false,
      showIn: {
        create: false,
        edit: false,
      },
    },
    {
      name: 'record_id',
      type: AdminForthDataTypes.STRING,
      required: false,
      foreignResource: {
        polymorphicOn: 'resource_id',
        polymorphicResources: [
          {
            resourceId: 'cars_sl',
            whenValue: 'car',
          },
        ],
      },
    },
    {
      name: 'image_path',
      required: false,
    },
  ],
} as AdminForthResourceInput;
