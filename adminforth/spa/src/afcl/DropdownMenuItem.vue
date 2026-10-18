<template>
  <component
    :is="to && !disabled ? RouterLink : 'div'"
    v-bind="restAttrs"
    :to="disabled ? undefined : to"
    role="menuitem"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled || undefined"
    :class="classes"
    @click="select"
    @keydown.enter.self.prevent="activate"
    @keydown.space.self.prevent="activate"
  >
    <span
      v-if="$slots.icon"
      class="afcl-dropdown-menu-item-icon flex shrink-0 items-center [&>svg]:w-4 [&>svg]:h-4"
      :class="!danger && 'text-lightInputIconColor dark:text-darkInputIconColor'"
    >
      <slot name="icon" />
    </span>
    <span class="min-w-0 flex-1">
      <slot />
    </span>
    <span v-if="$slots.suffix" class="afcl-dropdown-menu-item-suffix ms-auto flex shrink-0 items-center gap-1 text-xs text-lightDropdownButtonsPlaceholderText dark:text-darkDropdownButtonsPlaceholderText">
      <slot name="suffix" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';
import { DROPDOWN_MENU_KEY } from './dropdownMenuContext';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  disabled?: boolean,
  danger?: boolean,
  to?: RouteLocationRaw,
  // a click does not close the menu, e.g. on a row which expands nested items
  keepMenuOpen?: boolean,
}>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void,
}>();

const menu = inject(DROPDOWN_MENU_KEY, null);

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const classes = computed(() => mergeClasses(
  'afcl-dropdown-menu-item flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none outline-none transition-colors',
  // an expanded row (submenu or accordion trigger) stays highlighted
  'aria-expanded:bg-lightDropdownOptionsHoverBackground dark:aria-expanded:bg-darkDropdownOptionsHoverBackground',
  !props.disabled && [
    'hover:bg-lightDropdownOptionsHoverBackground focus-visible:bg-lightDropdownOptionsHoverBackground',
    'dark:hover:bg-darkDropdownOptionsHoverBackground dark:focus-visible:bg-darkDropdownOptionsHoverBackground',
  ],
  props.danger && 'text-lightInputErrorColor dark:text-darkInputErrorColor',
  props.disabled && 'opacity-50 cursor-not-allowed',
  attrs.class as ClassNameValue,
));

// keyboard activation goes through a real click, so RouterLink navigation runs as well
function activate(e: KeyboardEvent) {
  (e.currentTarget as HTMLElement).click();
}

function select(e: MouseEvent) {
  if (props.disabled) {
    return;
  }
  emit('click', e);
  if (!props.keepMenuOpen) {
    menu?.itemSelected();
  }
}
</script>
