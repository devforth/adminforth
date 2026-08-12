<template>
  <div class="min-h-screen bg-slate-100 p-6 dark:bg-slate-900">
    <div class="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
        Public page
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Custom page with <code>sidebarAndHeader: 'none'</code>. It must render for anonymous user without redirect to login.
      </p>

      <div class="mt-5 rounded-xl border p-4"
        :class="loggedIn
          ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30'
          : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'"
      >
        <div class="text-sm font-semibold text-slate-900 dark:text-white">
          {{ loggedIn ? `Logged in as ${coreStore.username}` : 'Not logged in (anonymous)' }}
        </div>
        <div class="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {{ loggedIn
            ? 'Full config arrived: menu, resources and adminUser are filled.'
            : 'Only public part of config arrived: menu, resources and adminUser stay empty.' }}
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <div v-for="row in rows" :key="row.label" class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {{ row.label }}
          </div>
          <div class="mt-1 break-all text-sm text-slate-900 dark:text-white">
            {{ row.value }}
          </div>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-3">
        <RouterLink to="/login" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-700">
          Go to login
        </RouterLink>
        <RouterLink to="/overview" class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 dark:border-slate-600 dark:text-white">
          Go to protected page (redirects to login when anonymous)
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

const loggedIn = computed(() => !!coreStore.adminUser);

const rows = computed(() => [
  // public part of config, is here for anyone
  { label: 'config.brandName (public)', value: coreStore.config?.brandName ?? '—' },
  { label: 'config.loginBackgroundPosition (public)', value: coreStore.config?.loginBackgroundPosition ?? '—' },
  // logged in part of config, is here only for logged in user
  { label: 'config.datesFormat (logged in only)', value: coreStore.config?.datesFormat ?? '—' },
  { label: 'config.usernameField (logged in only)', value: coreStore.config?.usernameField ?? '—' },
  { label: 'menu items', value: coreStore.menu.length },
  { label: 'resources', value: Object.keys(coreStore.resourceById).length },
]);
</script>
