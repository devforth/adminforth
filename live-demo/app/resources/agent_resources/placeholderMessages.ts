import type { CompletionAdapter, HttpExtra } from 'adminforth';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ISO_3166_1_ALPHA_2_RE = /^[A-Z]{2}$/;

const EN_PLACEHOLDER_MESSAGES = [
  'Find most costy apartment',
  'Give me apartments price histogram',
  'What is sum cost of all apratments',
  'Who modifiend most costy appartment',
] as const;

const LOCALIZED_PLACEHOLDER_MESSAGES_SCHEMA = {
  name: 'localized_placeholder_messages',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['messages'],
    properties: {
      messages: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
} as const;

type TerritoryInfoJson = {
  supplemental?: {
    territoryInfo?: Record<
      string,
      {
        languagePopulation?: Record<
          string,
          {
            _populationPercent?: number | string;
          }
        >;
      }
    >;
  };
};

const territoryInfoJson = require('cldr-core/supplemental/territoryInfo.json') as TerritoryInfoJson;
const localizedPlaceholderMessagesCache = new Map<string, Promise<string[]>>();

function normalizeCountryCode(countryCode?: string): string {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? '';
  return ISO_3166_1_ALPHA_2_RE.test(normalizedCountryCode)
    ? normalizedCountryCode
    : 'XX';
}

export function getClientCountry(httpExtra?: HttpExtra): string {
  return normalizeCountryCode(
    httpExtra?.headers['cf-ipcountry'] ?? httpExtra?.headers['CF-IPCountry'],
  );
}

function getTopTerritoryLanguage(countryCode: string): string | null {
  const territory = territoryInfoJson.supplemental?.territoryInfo?.[countryCode];
  const languagePopulation = territory?.languagePopulation;

  if (!languagePopulation) {
    return null;
  }

  const topLanguage = Object.entries(languagePopulation)
    .map(([language, meta]) => {
      const primaryLanguage = String(language).split('-')[0]?.toLowerCase() ?? '';
      const populationPercent = Number(meta?._populationPercent ?? 0);

      return {
        language: primaryLanguage,
        populationPercent: Number.isFinite(populationPercent)
          ? populationPercent
          : 0,
      };
    })
    .filter((item) => item.language.length === 2)
    .filter((item) => item.language !== 'en')
    .sort((left, right) => right.populationPercent - left.populationPercent)[0];

  return topLanguage?.language ?? null;
}

async function translatePlaceholderMessages({
  completionAdapter,
  countryCode,
  language,
}: {
  completionAdapter: CompletionAdapter;
  countryCode: string;
  language: string;
}): Promise<string[]> {
  const content = [
    'You are a UI placeholder translation engine.',
    'Translate the `messages` array to the language in `target_language_iso639_1`.',
    'Keep each message concise, natural, and suitable for a chat placeholder prompt.',
    'Preserve the array length and ordering.',
    'When the target language distinguishes between informal and formal second-person pronouns, always use the informal singular form.',
    'Respond with a single JSON object matching the schema.',
    JSON.stringify({
      country_iso3166_1: countryCode,
      target_language_iso639_1: language,
      messages: EN_PLACEHOLDER_MESSAGES,
    }),
  ].join('\n\n');

  const result = await completionAdapter.complete({
    content,
    maxTokens: 300,
    outputSchema: LOCALIZED_PLACEHOLDER_MESSAGES_SCHEMA,
    reasoningEffort: 'low',
  });

  if (result.error) {
    throw new Error(result.error);
  }

  if (!result.content) {
    throw new Error('Completion adapter returned an empty localized placeholder response');
  }

  const parsed = JSON.parse(result.content) as { messages: string[] };

  if (!Array.isArray(parsed.messages) || parsed.messages.length !== EN_PLACEHOLDER_MESSAGES.length) {
    throw new Error('Completion adapter returned invalid localized placeholder messages');
  }

  return parsed.messages.map((message) => message.trim());
}

export async function getLocalizedPlaceholderMessages({
  completionAdapter,
  httpExtra,
}: {
  completionAdapter: CompletionAdapter;
  httpExtra?: HttpExtra;
}): Promise<string[]> {
  const countryCode = getClientCountry(httpExtra);
  const topLanguage = getTopTerritoryLanguage(countryCode);

  if (!topLanguage) {
    return [...EN_PLACEHOLDER_MESSAGES];
  }

  const cacheKey = `${countryCode}:${topLanguage}`;
  const cachedMessages = localizedPlaceholderMessagesCache.get(cacheKey);

  if (cachedMessages) {
    return cachedMessages;
  }

  const localizationPromise = translatePlaceholderMessages({
    completionAdapter,
    countryCode,
    language: topLanguage,
  }).catch((error) => {
    console.error('Failed to localize agent placeholder messages', error);
    return [...EN_PLACEHOLDER_MESSAGES];
  });

  localizedPlaceholderMessagesCache.set(cacheKey, localizationPromise);

  return localizationPromise;
}