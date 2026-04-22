<template>
  <div class="space-y-5">
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Agent Debug
          </div>
          <div class="mt-1 text-sm text-slate-700 dark:text-slate-200">
            Sequence-by-sequence trace for this turn.
          </div>
        </div>
        <div class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
          {{ debugSequences.length }} sequence{{ debugSequences.length === 1 ? '' : 's' }}
        </div>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-4">
        <div class="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tool Calls</div>
          <div class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{{ totalToolCalls }}</div>
        </div>
        <div class="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Final Text Sequences</div>
          <div class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{{ finalTextSequences }}</div>
        </div>
        <div class="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tool Sequences</div>
          <div class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{{ toolCallSequences }}</div>
        </div>
        <div class="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cached Prompt Tokens</div>
          <div class="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{{ formatNumber(totalCachedTokens) }}</div>
        </div>
      </div>
    </div>

    <div
      v-if="!debugSequences.length"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
    >
      No debug data stored for this turn.
    </div>

    <details
      v-for="sequence in debugSequences"
      :key="sequence.sequenceId"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <summary class="cursor-pointer list-none">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-lg font-semibold text-slate-900 dark:text-white">
              Sequence #{{ sequence.sequenceId }}
            </div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Started {{ formatTimestamp(sequence.startedAt) }}
              <span v-if="sequence.endedAt"> • Ended {{ formatTimestamp(sequence.endedAt) }}</span>
              <span v-if="sequenceDuration(sequence)"> • {{ sequenceDuration(sequence) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              v-if="sequence.cachedTokens > 0"
              class="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
            >
              Cache hit: {{ formatNumber(sequence.cachedTokens) }}
            </div>
            <div
              class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              :class="sequence.resultType === 'tool_calls'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'"
            >
              {{ sequence.resultType.replace('_', ' ') }}
            </div>
            <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Toggle
            </div>
          </div>
        </div>
      </summary>

      <div class="mt-4 grid gap-3 md:grid-cols-5">
        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Prompt Tokens</div>
          <div class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {{ sequence.prompt ? `${formatNumber(sequence.promptTokens)} tokens` : 'Empty' }}
          </div>
        </div>
        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Reasoning Tokens</div>
          <div class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {{ sequence.reasoning ? `${formatNumber(sequence.reasoningTokens)} tokens` : 'Empty' }}
          </div>
        </div>
        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Text Tokens</div>
          <div class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {{ sequence.text ? `${formatNumber(sequence.textTokens)} tokens` : 'Empty' }}
          </div>
        </div>
        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tool Calls</div>
          <div class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {{ sequence.toolCalls.length }}
          </div>
        </div>
        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cached Prompt Tokens</div>
          <div class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {{ formatNumber(sequence.cachedTokens) }}
          </div>
        </div>
      </div>

      <section v-if="sequence.prompt" class="mt-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Prompt Sent To LLM
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="copyText(`sequence-${sequence.sequenceId}-prompt`, sequence.prompt)"
          >
            {{ copyLabel(`sequence-${sequence.sequenceId}-prompt`) }}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-sky-100 whitespace-pre-wrap">{{ sequence.prompt }}</pre>
      </section>

      <section v-if="sequence.reasoning" class="mt-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Reasoning
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="copyText(`sequence-${sequence.sequenceId}-reasoning`, sequence.reasoning)"
          >
            {{ copyLabel(`sequence-${sequence.sequenceId}-reasoning`) }}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100 whitespace-pre-wrap">{{ sequence.reasoning }}</pre>
      </section>

      <section v-if="sequence.text" class="mt-4">
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Text
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            @click="copyText(`sequence-${sequence.sequenceId}-text`, sequence.text)"
          >
            {{ copyLabel(`sequence-${sequence.sequenceId}-text`) }}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-lg bg-slate-100 p-4 text-xs leading-6 text-slate-800 whitespace-pre-wrap dark:bg-slate-800 dark:text-slate-100">{{ sequence.text }}</pre>
      </section>

      <section v-if="sequence.toolCalls.length" class="mt-4 space-y-3">
        <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Tool Calls
        </div>

        <details
          v-for="(toolCall, toolCallIndex) in sequence.toolCalls"
          :key="`${sequence.sequenceId}-${toolCallIndex}-${toolCall.toolName}`"
          class="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <summary class="cursor-pointer list-none px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {{ toolCall.toolName }}
              </div>
              <div
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                :class="toolCall.error
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                  : 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200'"
              >
                {{ toolCall.error ? 'error' : 'ok' }}
              </div>
            </div>
          </summary>

          <div class="grid gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Input YAML
                </div>
                <button
                  type="button"
                  class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  @click="copyText(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-input`, toolCall.input)"
                >
                  {{ copyLabel(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-input`) }}
                </button>
              </div>
              <pre class="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100 whitespace-pre-wrap">{{ toolCall.input }}</pre>
            </div>

            <div v-if="toolCall.output">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Output YAML
                </div>
                <button
                  type="button"
                  class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  @click="copyText(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-output`, toolCall.output)"
                >
                  {{ copyLabel(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-output`) }}
                </button>
              </div>
              <pre class="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-emerald-100 whitespace-pre-wrap">{{ toolCall.output }}</pre>
            </div>

            <div v-if="toolCall.error">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500 dark:text-rose-300">
                  Error YAML
                </div>
                <button
                  type="button"
                  class="rounded-md border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/60"
                  @click="copyText(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-error`, toolCall.error)"
                >
                  {{ copyLabel(`sequence-${sequence.sequenceId}-tool-${toolCall.toolCallId}-error`) }}
                </button>
              </div>
              <pre class="max-h-72 overflow-auto rounded-lg bg-rose-950 p-4 text-xs leading-6 text-rose-100 whitespace-pre-wrap">{{ toolCall.error }}</pre>
            </div>
          </div>
        </details>
      </section>
    </details>

    <details class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <summary class="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-white">
        <span>Raw JSON</span>
        <button
          type="button"
          class="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          @click.prevent.stop="copyText('raw-json', rawJson)"
        >
          {{ copyLabel('raw-json') }}
        </button>
      </summary>
      <pre class="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100 whitespace-pre-wrap">{{ rawJson }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  AdminForthResourceColumnCommon,
  AdminForthResourceCommon,
  AdminUser,
} from "@/types/Common";

type DebugToolCall = {
  toolCallId: string;
  toolName: string;
  input: string;
  output: string | null;
  error: string | null;
};

type DebugSequence = {
  sequenceId: number;
  startedAt: string;
  prompt: string;
  promptTokens: number;
  reasoning: string;
  reasoningTokens: number;
  text: string;
  textTokens: number;
  cachedTokens: number;
  responseId: string | null;
  toolCalls: DebugToolCall[];
  endedAt: string;
  resultType: 'tool_calls' | 'final_text';
};

const props = defineProps<{
  column: AdminForthResourceColumnCommon;
  record: any;
  meta: any;
  resource: AdminForthResourceCommon;
  adminUser: AdminUser;
}>();

const debugSequences = computed<DebugSequence[]>(() => props.record[props.column.name] ?? []);

const totalToolCalls = computed(() =>
  debugSequences.value.reduce((sum, sequence) => sum + sequence.toolCalls.length, 0),
);

const finalTextSequences = computed(() =>
  debugSequences.value.filter((sequence) => sequence.resultType === 'final_text').length,
);

const toolCallSequences = computed(() =>
  debugSequences.value.filter((sequence) => sequence.resultType === 'tool_calls').length,
);

const totalCachedTokens = computed(() =>
  debugSequences.value.reduce((sum, sequence) => sum + sequence.cachedTokens, 0),
);

const rawJson = computed(() => JSON.stringify(debugSequences.value, null, 2));
const copiedFieldKey = ref<string | null>(null);
let copiedFieldResetTimer: ReturnType<typeof setTimeout> | null = null;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function formatNumber(value: number) {
  if (value) {
    return value.toLocaleString();
  }
  return '0';
}

function sequenceDuration(sequence: DebugSequence) {
  const startedAtMs = new Date(sequence.startedAt).getTime();
  const endedAtMs = new Date(sequence.endedAt).getTime();
  const durationMs = endedAtMs - startedAtMs;

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
}

async function copyText(key: string, value: string) {
  await navigator.clipboard.writeText(value);
  copiedFieldKey.value = key;

  if (copiedFieldResetTimer) {
    clearTimeout(copiedFieldResetTimer);
  }

  copiedFieldResetTimer = setTimeout(() => {
    if (copiedFieldKey.value === key) {
      copiedFieldKey.value = null;
    }
  }, 1600);
}

function copyLabel(key: string) {
  return copiedFieldKey.value === key ? 'Copied' : 'Copy';
}
</script>
