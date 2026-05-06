import AdminForth, { AdminForthDataTypes, AdminForthResourceColumn } from 'adminforth';
import type { AdminForthResource } from 'adminforth';
import AdminForthAgent from '@adminforth/agent';
import CompletionAdapterOpenAIResponses from '@adminforth/completion-adapter-openai-responses';
import ForeignInlineListPlugin from '@adminforth/foreign-inline-list';
import { randomUUID } from 'crypto';
import { getLocalizedPlaceholderMessages } from './agent_resources/placeholderMessages';
import OpenAIAudioAdapter from '@adminforth/audio-adapter-openai'

const openAiApiKey = process.env.OPENAI_API_KEY as string;

const createCompletionAdapter = (
  model: string,
  effort: 'low' | 'medium' | 'xhigh',
) => new CompletionAdapterOpenAIResponses({
  openAiApiKey,
  model,
  extraRequestBodyParameters: {
    reasoning: {
      effort,
    },
  },
});

const balancedCompletionAdapter = createCompletionAdapter('gpt-5.4-mini', 'medium');
const fastCompletionAdapter = createCompletionAdapter('gpt-5.4-mini', 'low');
const smartThinkingCompletionAdapter = createCompletionAdapter('gpt-5.4', 'xhigh');

const blockDemoUsers = async ({ adminUser }: { adminUser: any }) => {
  if (adminUser.dbUser && adminUser.dbUser.role !== 'superadmin') {
    return { ok: false, error: "You can't do this on demo.adminforth.dev" }
  }
  return { ok: true };
}  
export default { 
  dataSource: 'maindb', 
  table: 'users',
  resourceId: 'users',
  label: 'Users',  
  recordLabel: (r: any) => `👤 ${r.email}`,
  plugins: [
    new ForeignInlineListPlugin({
      foreignResourceId: 'aparts',
      modifyTableResourceConfig: (resourceConfig: AdminForthResource) => {
        // hide column 'square_meter' from both 'list' and 'filter'
        const column = resourceConfig.columns.find((c: AdminForthResourceColumn) => c.name === 'square_meter')!.showIn = [] as any;
        // feel free to console.log and edit resourceConfig as you need
      },
    }),
    new ForeignInlineListPlugin({
      foreignResourceId: 'audit_logs',
    }), 
    new AdminForthAgent({
      audioAdapter: new OpenAIAudioAdapter({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      placeholderMessages: async ({ httpExtra }: any) => getLocalizedPlaceholderMessages({
        completionAdapter: fastCompletionAdapter as any,
        httpExtra,
      }),
      modes: [
        {
          name: 'Balanced',
          completionAdapter: balancedCompletionAdapter,
        },
        {
          name: 'Fast',
          completionAdapter: fastCompletionAdapter,
        },
        {
          name: 'Smart Thinking',
          completionAdapter: smartThinkingCompletionAdapter,
        },
      ],
      maxTokens: 10000,
      sessionResource: {
        resourceId: 'sessions',
        idField: 'id',
        titleField: 'title',
        turnsField: 'turns',
        askerIdField: 'asker_id',
        createdAtField: 'created_at',
      },
      turnResource: {
        resourceId: 'turns',
        idField: 'id',
        sessionIdField: 'session_id',
        createdAtField: 'created_at',
        promptField: 'prompt',
        responseField: 'response',
      },
      stickByDefault: true,
    }),
  ],
  columns: [
    { 
      name: 'id', 
      label: 'Identifier',
      primaryKey: true,
      fillOnCreate: ({ initialRecord, adminUser }: any) => randomUUID(),
      showIn: ['list', 'filter', 'show'],
    },
    { 
      name: 'email', 
      type: AdminForthDataTypes.STRING,
      required: true,
      isUnique: true,
      validation: [
        {
          regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'Email is not valid, must be in format example@test.com'
        },
      ]
    },
    {
      name: 'created_at', 
      type: AdminForthDataTypes.DATETIME,
      showIn: ['list', 'filter', 'show'],
      fillOnCreate: ({initialRecord, adminUser}: any) => (new Date()).toISOString(),
    },
    {
      name: 'role',
      enum: [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'user', label: 'User' },
      ]
    },
    {
      name: 'password',
      virtual: true,  // field will not be persisted into db
      required: { create: true }, // make required only on create page
      editingNote: { edit: 'Leave empty to keep password unchanged' },
      minLength: 4,
      type: AdminForthDataTypes.STRING,
      showIn: ['create', 'edit'], // to show field only on create and edit pages
      masked: true, // to show stars in input field
    },
    { name: 'password_hash', backendOnly: true, showIn: []}
  ],
  hooks: {
    create: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser, resource }: any) => {
            record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            return { ok: true };
        }
      ],
    },
    edit: {
      beforeSave: [
        blockDemoUsers,
        async ({ record, adminUser, resource}: any) => {
            if (record.password) {
                record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
            }
            return { ok: true }
        },
      ]
    },
    delete: {
        beforeSave: blockDemoUsers,
    },
  }
}