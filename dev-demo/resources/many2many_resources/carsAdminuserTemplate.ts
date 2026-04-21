import { AdminForthDataTypes, AdminForthResourceInput } from 'adminforth';


export default function carsAdminuserResourseTemplate(resourceId: string, carsResourceId: string, dataSource: string, pkFileldName: string) {
  return {
    dataSource: dataSource,
    table: 'adminuserCars',
    resourceId: resourceId,
    label: 'Adminuser Cars',
    recordLabel: (r) => `🚘 ${r.model} 🚗`,
    columns: [
      {
        name: pkFileldName,
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
        name: 'adminuserId',
        type: AdminForthDataTypes.STRING,
        foreignResource: { 
          resourceId: 'adminuser', 
          searchableFields: ['email'], 
          searchIsCaseSensitive: true 
        }
      },
      {
        name: 'carId',
        type: AdminForthDataTypes.STRING,
        foreignResource: { 
          resourceId: carsResourceId,
          searchableFields: ['model'],
          searchIsCaseSensitive: true 
        }
      },
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
}