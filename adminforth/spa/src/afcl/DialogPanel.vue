<template>
  <div v-bind="restAttrs" :class="rootClasses">
    <div :class="mergeClasses(
      'afcl-dialog-panel-header flex items-center gap-3.5 border-b border-lightDialogBreakLine py-5 pl-6 dark:border-darkDialogBreakLine',
      closable ? 'pr-4' : 'pr-6',
      classes.header,
    )">
      <div
        v-if="$slots.icon"
        :class="mergeClasses(
          'afcl-dialog-panel-icon flex w-10 h-10 shrink-0 items-center justify-center rounded-lg [&>svg]:w-5 [&>svg]:h-5',
          'bg-lightPrimary/10 text-lightPrimary dark:bg-darkPrimary/20 dark:text-darkPrimary',
          classes.icon,
        )"
      >
        <slot name="icon" />
      </div>
      <div :class="mergeClasses('afcl-dialog-panel-title-wrap flex-1 min-w-0', classes.titleWrap)">
        <slot name="title">
          <h2 :class="mergeClasses('afcl-dialog-panel-title break-words text-lg leading-6 font-semibold text-lightDialogHeaderText dark:text-darkDialogHeaderText', classes.title)">{{ title }}</h2>
          <p v-if="subtitle" :class="mergeClasses('afcl-dialog-panel-subtitle mt-0.5 text-sm leading-5 text-lightInputIconColor dark:text-darkInputIconColor', classes.subtitle)">{{ subtitle }}</p>
        </slot>
      </div>
      <Button
        v-if="closable"
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        :aria-label="$t('Close')"
        :class="mergeClasses(
          'afcl-dialog-panel-close text-lightDialogCloseButton hover:text-lightDialogCloseButtonHover hover:bg-lightDialogCloseButtonHoverBackground',
          'dark:text-darkDialogCloseButton dark:hover:text-darkDialogCloseButtonHover dark:hover:bg-darkDialogCloseButtonHoverBackground',
          classes.close,
        )"
        @click="emit('close')"
      >
        <IconX aria-hidden="true" />
      </Button>
    </div>

    <div :class="mergeClasses('afcl-dialog-panel-body flex flex-col gap-4 px-6 pt-5 pb-6', classes.body)">
      <slot />
      <p v-if="error" role="alert" :class="mergeClasses('afcl-dialog-panel-error -mt-1 flex items-center gap-1.5 text-sm text-lightDanger dark:text-darkDanger', classes.error)">
        <IconCircleAlert class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ error }}
      </p>
    </div>

    <!-- a main action on the right, a secondary one may sit on the left with ms-0 me-auto -->
    <div
      v-if="$slots.footer"
      :class="mergeClasses(
        'afcl-dialog-panel-footer flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-lightDialogBreakLine bg-lightFormHeading py-3 pl-6 pr-5',
        'dark:border-darkDialogBreakLine dark:bg-darkFormHeading',
        classes.footer,
      )"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { IconCircleAlert, IconX } from '@iconify-prerendered/vue-lucide';
import { mergeClasses } from './classMerge';
import Button from './Button.vue';

type DialogPanelPart = 'header' | 'icon' | 'titleWrap' | 'title' | 'subtitle' | 'close' | 'body' | 'error' | 'footer';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  title?: string,
  subtitle?: string,
  error?: string | null,
  // shows a close button in the header which emits close
  closable?: boolean,
  // extra classes for the parts, e.g. the af-* classes apps restyle a screen by
  classes?: Partial<Record<DialogPanelPart, ClassNameValue>>,
}>(), {
  title: '',
  subtitle: '',
  error: null,
  closable: false,
  classes: () => ({}),
});

const emit = defineEmits<{
  (e: 'close'): void,
}>();

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

// a panel on the page is drawn like other surfaces: a hairline border and the light shadow of controls,
// a panel which floats over the page (in a modal) passes shadow-popover
const rootClasses = computed(() => mergeClasses(
  'afcl-dialog-panel relative flex flex-col w-full max-w-md overflow-hidden rounded-xl border shadow-customLight',
  'border-lightDialogBreakLine bg-lightDialogBackgorund dark:border-darkDialogBreakLine dark:bg-darkDialogBackgorund',
  attrs.class as ClassNameValue,
));
</script>
