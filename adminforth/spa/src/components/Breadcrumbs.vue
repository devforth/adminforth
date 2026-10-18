<template>
  <nav class="flex items-center min-h-[2.25rem]" aria-label="Breadcrumb">
      <ol class="flex min-w-0 items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li class="inline-flex shrink-0 items-center">
          <RouterLink :to="{name: 'home'}" class="inline-flex items-center text-sm text-lightBreadcrumbsHomepageText hover:text-lightBreadcrumbsHomepageTextHover dark:text-darkBreadcrumbsHomepageText dark:hover:text-darkBreadcrumbsHomepageTextHover">
            <IconHouse class="w-3.5 h-3.5 @lg/header:me-1.5" aria-hidden="true" />
            <!-- a narrow header keeps only the house, the label stays for screen readers -->
            <span class="sr-only @lg/header:not-sr-only">{{ $t('Home') }}</span>
          </RouterLink>
        </li>
        <li class="min-w-0">
          <div class="flex items-center">
            <IconChevronRight class="shrink-0 rtl:rotate-180 w-3.5 h-3.5 text-lightBreadcrumbsArrowIcon dark:text-darkBreadcrumbsArrowIcon mx-0.5" aria-hidden="true" />
            <RouterLink :to="{name: 'resource-list', params: { resourceId: $route.params.resourceId }}" class="md:ms-1 truncate"
              :class="$route.params.primaryKey
                ? 'text-sm text-lightBreadcrumbsHomepageText hover:text-lightBreadcrumbsHomepageTextHover dark:text-darkBreadcrumbsHomepageText dark:hover:text-darkBreadcrumbsHomepageTextHover'
                : 'text-xl leading-7 font-semibold tracking-tight text-lightBreadcrumbsText dark:text-darkBreadcrumbsText'">{{ coreStore.resourceById[$route.params.resourceId]?.label }}</RouterLink>
          </div>
        </li>

        <li v-if="$route.params.primaryKey" class="min-w-0">
          <div class="flex items-center">
            <IconChevronRight class="shrink-0 rtl:rotate-180 w-3.5 h-3.5 text-lightBreadcrumbsArrowIcon dark:text-darkBreadcrumbsArrowIcon mx-0.5" aria-hidden="true" />
            <span class="ms-1 text-xl leading-7 font-semibold tracking-tight text-lightBreadcrumbsText md:ms-1 dark:text-darkBreadcrumbsText
              max-w-80 truncate">
              {{ $route.name === 'resource-edit' ? $t('Edit') : $t('Show') }} {{ coreStore.record?._label }}</span>
          </div>
        </li>

       
      </ol>
    </nav>
</template>

<script setup>
import { useCoreStore } from '@/stores/core';
import { IconHouse, IconChevronRight } from '@iconify-prerendered/vue-lucide';

const coreStore = useCoreStore()
</script>