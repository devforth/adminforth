<template>
  <div v-bind="restAttrs" :class="rootClasses">
    <DropdownMenuItem
      keepMenuOpen
      :aria-expanded="isOpen"
      :class="['afcl-dropdown-menu-accordion-trigger', triggerClass]"
      @click="isOpen = !isOpen"
    >
      <template v-if="$slots.icon" #icon>
        <slot name="icon" />
      </template>
      {{ label }}
      <template #suffix>
        <IconChevronDown
          class="w-4 h-4 text-lightInputIconColor dark:text-darkInputIconColor transition-transform duration-150"
          :class="isOpen && 'rotate-180'"
        />
      </template>
    </DropdownMenuItem>
    <!-- collapsed items stay in layout with zero height, so the menu already fits its widest item and does not jump on expand -->
    <div
      role="group"
      class="afcl-dropdown-menu-accordion-items [&>.afcl-dropdown-menu-item]:ps-9"
      :class="!isOpen && 'h-0 overflow-hidden invisible'"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { IconChevronDown } from '@iconify-prerendered/vue-lucide';
import { mergeClasses } from './classMerge';
import DropdownMenuItem from './DropdownMenuItem.vue';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  label: string,
  triggerClass?: ClassNameValue,
}>(), {
  triggerClass: '',
});

const isOpen = defineModel<boolean>('open', { default: false });

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const rootClasses = computed(() => mergeClasses('afcl-dropdown-menu-accordion', attrs.class as ClassNameValue));
</script>
