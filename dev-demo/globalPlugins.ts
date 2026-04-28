import CompletionAdapterOpenAIResponses from '../adapters/adminforth-completion-adapter-openai-responses/index.js';
import AdminForthAgent from '../plugins/adminforth-agent/index.js';
import AdminForthPlugin from '../adminforth/basePlugin.js';

const OVH_AI_ENDPOINTS_BASE_URL = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1';
const ovhAiEndpointsAccessToken = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN;
const openAiResponsesApiKey = ovhAiEndpointsAccessToken || process.env.OPENAI_API_KEY;
const usesOvhAiEndpoints = Boolean(ovhAiEndpointsAccessToken);

function createAgentCompletionAdapter(
  model: string,
  effort: 'low' | 'medium' | 'xhigh',
) {
  return new CompletionAdapterOpenAIResponses({
    openAiApiKey: openAiResponsesApiKey as string,
    baseUrl: usesOvhAiEndpoints ? OVH_AI_ENDPOINTS_BASE_URL : undefined,
    model: usesOvhAiEndpoints ? 'gpt-oss-120b' : model,
    extraRequestBodyParameters: {
      ...(usesOvhAiEndpoints ? { store: false } : {}),
      reasoning: {
        effort,
      },
    },
  });
}

export const globalPlugins = [
  new AdminForthAgent({
    placeholderMessages: async ({ adminUser, httpExtra }) => {
      return [
        "What is a cars count in SQLite",
        "Build average car price by days chart in SQLite",
      ]
    },
    modes: [
      {
        name: 'Balanced',
        completionAdapter: createAgentCompletionAdapter('gpt-5.4-mini', 'medium'),
      },
      {
        name: 'Fast',
        completionAdapter: createAgentCompletionAdapter('gpt-5.4-mini', 'low'),
      },
      {
        name: 'Smart Thinking',
        completionAdapter: createAgentCompletionAdapter('gpt-5.4', 'xhigh'),
      },
    ],
    maxTokens: 10000,
    reasoning: 'none',
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
      debugField: 'dubbug',
    },
  }),
];