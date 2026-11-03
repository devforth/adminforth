import AdminForthAgent from '@adminforth/agent';
import AdminForthMcpPlugin from '@adminforth/mcp';
import { getLocalizedPlaceholderMessages } from './resources/agent_resources/placeholderMessages';
import OpenAIAudioAdapter from '@adminforth/audio-adapter-openai'
import CompletionAdapterOpenAIResponses from '@adminforth/completion-adapter-openai-responses';
import UserSessionsPlugin from '@adminforth/user-sessions';
import LevelDBKeyValueAdapter from '@adminforth/key-value-adapter-leveldb';

const openAiApiKey = process.env.OPENAI_API_KEY as string;
const adminPanelOrigin = process.env.NODE_ENV === 'production' ? 'https://demo.adminforth.dev' : 'http://localhost:3500';

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

const balancedCompletionAdapter = createCompletionAdapter('gpt-6-luna', 'medium');
const fastCompletionAdapter = createCompletionAdapter('gpt-6-luna', 'low');
// const smartThinkingCompletionAdapter = createCompletionAdapter('gpt-5.4', 'xhigh');

// temporary: to test sign-in notifications and login history on the live demo
export const userSessions = new UserSessionsPlugin({
  // db folder is the persistent volume, so sessions survive deploys
  keyValueAdapter: new LevelDBKeyValueAdapter({ dbPath: './db/user-sessions' }),
  canManageOtherUsersSessions: async (adminUser) => adminUser.dbUser.role === 'superadmin',
  onNewLogin: async (params) => {
    console.log('UserSessionsPlugin onNewLogin:', JSON.stringify({ ...params, revokeUrl: `${adminPanelOrigin}${params.revokePath}` }));
  },
  loginHistory: {
    resourceId: 'login_history',
    // short to see failed attempts in the list without waiting for a minute
    failedLogsInterval: '10s',
    resourceColumns: {
      userIdColumnName: 'user_id',
      successColumnName: 'success',
      attemptsColumnName: 'attempts',
      ipColumnName: 'ip',
      countryColumnName: 'country',
      userAgentColumnName: 'user_agent',
      ipsColumnName: 'ips',
      createdAtColumnName: 'created_at',
    },
  },
});

export const adminForthMcp = new AdminForthMcpPlugin({
  adminPanelOrigin,
  authSecretResource: {
    resourceId: 'mcp_auth_secrets',
    idField: 'id',
    nameField: 'name',
    secretHashField: 'secret_hash',
    userIdField: 'user_id',
    createdAtField: 'created_at',
    lastUsedAtField: 'last_used_at',
    lastUsedByAgentField: 'last_used_by_agent',
    readOnlyField: 'read_only',
    oauthClientIdField: 'oauth_client_id',
  },
});

export const adminForthAgent = new AdminForthAgent({
  audioAdapter: new OpenAIAudioAdapter({
    apiKey: openAiApiKey,
    defaultVoice: 'alloy',
    defaultSpeed: 1.25,
  }),
  placeholderMessages: async ({ headers }) => getLocalizedPlaceholderMessages({
    completionAdapter: fastCompletionAdapter,
    headers,
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
    checkpointIdField: 'checkpoint_id',
    attachmentsField: 'attachments',
  },
  checkpointResource: {
    resourceId: 'agent_checkpoints',
    idField: 'id',
    threadIdField: 'thread_id',
    checkpointNamespaceField: 'checkpoint_namespace',
    checkpointIdField: 'checkpoint_id',
    parentCheckpointIdField: 'parent_checkpoint_id',
    rowKindField: 'row_kind',
    taskIdField: 'task_id',
    sequenceField: 'sequence',
    createdAtField: 'created_at',
    checkpointPayloadField: 'checkpoint_payload',
    metadataPayloadField: 'metadata_payload',
    writesPayloadField: 'writes_payload',
    schemaVersionField: 'schema_version',
  },
  stickByDefault: true,
})