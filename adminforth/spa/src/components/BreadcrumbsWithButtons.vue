<template>
  <div>
    <!-- the header follows its own width, not the viewport, because the sidebar and the agent panel squeeze it too -->
    <div class="@container/header mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- a record title of show and edit takes the room it needs and the buttons go under it, a resource title gives way to the buttons -->
        <Breadcrumbs :class="$route.params.primaryKey ? 'min-w-0 flex-auto' : 'min-w-24 flex-1'" />
        <!-- filters take a full row under the title and the buttons, a wide header keeps all in one row -->
        <div v-if="$slots.filters" class="order-last basis-full flex flex-wrap items-center gap-2 @4xl/header:order-none @4xl/header:basis-auto @4xl/header:ms-auto">
          <slot name="filters"></slot>
        </div>
        <!-- actions for the checked rows get a row of their own above the table, so the buttons next to the title stay in place -->
        <div v-if="$slots.selection" class="order-last basis-full flex flex-wrap items-center gap-2">
          <slot name="selection"></slot>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <slot></slot>
        </div>
      </div>
    </div>
    <div v-if="coreStore.resourceColumnsError" >
      <PageNotFound :errorMessage="coreStore.resourceColumnsError" />
    </div>
  </div>

</template>

<script setup lang="ts">
import Breadcrumbs from '@/components/Breadcrumbs.vue';
import PageNotFound from '@/views/PageNotFound.vue';

import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();

</script>
