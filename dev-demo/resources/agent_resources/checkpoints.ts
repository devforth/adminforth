import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

// Persistent LangGraph checkpointer store for the AdminForth Agent plugin.
// Enables reliable multi-turn memory and message editing / branching.
export default {
  dataSource: 'sqlite',
  table: 'agent_checkpoints',
  resourceId: 'agent_checkpoints',
  label: 'Agent Checkpoints',
  columns: [
    { name: 'id', primaryKey: true, type: AdminForthDataTypes.STRING },
    { name: 'thread_id', type: AdminForthDataTypes.STRING },
    { name: 'checkpoint_namespace', type: AdminForthDataTypes.STRING },
    { name: 'checkpoint_id', type: AdminForthDataTypes.STRING },
    { name: 'parent_checkpoint_id', type: AdminForthDataTypes.STRING },
    { name: 'row_kind', type: AdminForthDataTypes.STRING },
    { name: 'task_id', type: AdminForthDataTypes.STRING },
    { name: 'sequence', type: AdminForthDataTypes.INTEGER },
    { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    { name: 'checkpoint_payload', type: AdminForthDataTypes.TEXT },
    { name: 'metadata_payload', type: AdminForthDataTypes.TEXT },
    { name: 'writes_payload', type: AdminForthDataTypes.TEXT },
    { name: 'schema_version', type: AdminForthDataTypes.INTEGER },
  ],
} as AdminForthResourceInput;
