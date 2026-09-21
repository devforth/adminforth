import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'sqlite',
  table: 'mcp_auth_secrets',
  resourceId: 'mcp_auth_secrets',
  label: 'MCP Auth Secrets',
  columns: [
    { name: 'id', primaryKey: true, type: AdminForthDataTypes.STRING },
    { name: 'name', type: AdminForthDataTypes.STRING },
    { name: 'secret_hash', type: AdminForthDataTypes.STRING, backendOnly: true },
    { name: 'user_id', type: AdminForthDataTypes.STRING },
    { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    { name: 'last_used_at', type: AdminForthDataTypes.DATETIME, required: false },
    { name: 'last_used_by_agent', type: AdminForthDataTypes.STRING, required: false },
  ],
  options: {
    allowedActions: {
      list: false,
      show: false,
      create: false,
      edit: false,
      delete: false,
    },
  },
} as AdminForthResourceInput;
