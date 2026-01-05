  import { AdminForthDataTypes, AdminForthResourceInput } from "../../adminforth/index.js";
  import { randomUUID } from "crypto";

  export default {
    dataSource: 'sqlite',
    table: 'passkeys',
    resourceId: 'passkeys',
    label: 'Passkeys',
    columns: [
      {
        name: 'id',
        label: 'ID',
        primaryKey: true,
        showIn: { all: false},
        fillOnCreate: () => randomUUID(),
      },
      {
        name: 'credential_id',
        label: 'Credential ID',
      },
      {
        name: 'user_id',
        label: 'User ID',
      },
      {
        name: "meta",
        type: AdminForthDataTypes.JSON,
        label: "Meta",
      }
    ],
    plugins: [],
    options: {},
  } as AdminForthResourceInput;