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
    options: {
      // The passkey table holds login credentials, not business data: the plugin manages every
      // row through its own endpoints, so nobody should reach it through the resource API.
      allowedActions: { all: false },
    },
  } as AdminForthResourceInput;