<template>
  <div ref="rootRef" v-bind="restAttrs" :class="rootClasses">
    <div class="afcl-dropdown-menu-trigger" @click="onTriggerClick">
      <slot name="trigger" :open="isOpen" />
    </div>
    <Teleport to="body" :disabled="!teleportToBody">
      <div
        v-if="keepMounted || isOpen"
        v-show="isOpen"
        ref="contentRef"
        role="menu"
        :class="contentClasses"
        :style="fixedStyle"
      >
        <slot :close="close" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, useAttrs, watch } from 'vue';
import { type ClassNameValue } from 'tailwind-merge';
import { mergeClasses } from './classMerge';
import { DROPDOWN_MENU_KEY, type DropdownMenuPlacement } from './dropdownMenuContext';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  placement?: DropdownMenuPlacement,
  closeOnSelect?: boolean,
  keepMounted?: boolean,
  teleportToBody?: boolean,
  contentClass?: ClassNameValue,
}>(), {
  placement: 'bottom-start',
  closeOnSelect: true,
  keepMounted: false,
  teleportToBody: false,
});

const isOpen = defineModel<boolean>('open', { default: false });

const attrs = useAttrs();
const restAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const VIEWPORT_MARGIN = 8;
const GAP = 6;

const PLACEMENT_CLASSES: Record<DropdownMenuPlacement, string> = {
  'bottom-start': 'top-full left-0 mt-1.5',
  'bottom-end': 'top-full right-0 mt-1.5',
  'left-start': 'top-0 right-full mr-2',
  'right-start': 'top-0 left-full ml-2',
};

const OPPOSITE_PLACEMENT: Record<DropdownMenuPlacement, DropdownMenuPlacement> = {
  'bottom-start': 'bottom-end',
  'bottom-end': 'bottom-start',
  'left-start': 'right-start',
  'right-start': 'left-start',
};

const parentMenu = inject(DROPDOWN_MENU_KEY, null);

const rootRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const flipped = ref(false);
const measuring = ref(false);
const fixedStyle = ref<Record<string, string>>();

const currentPlacement = computed(() => flipped.value ? OPPOSITE_PLACEMENT[props.placement] : props.placement);

const rootClasses = computed(() => mergeClasses('afcl-dropdown-menu relative inline-block', attrs.class as ClassNameValue));

const contentClasses = computed(() => mergeClasses(
  'afcl-dropdown-menu-content z-50 w-max min-w-[11rem] max-w-xs p-1 rounded-lg text-sm text-left',
  'bg-lightDropdownOptionsBackground text-lightDropdownOptionsText shadow-popover',
  'dark:bg-darkDropdownOptionsBackground dark:text-darkDropdownOptionsText dark:shadow-darkPopover',
  props.teleportToBody ? 'fixed overflow-y-auto' : ['absolute', PLACEMENT_CLASSES[currentPlacement.value]],
  measuring.value && 'invisible',
  props.contentClass,
));

provide(DROPDOWN_MENU_KEY, {
  itemSelected: () => {
    if (props.closeOnSelect) {
      close();
    }
  },
});

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

function toggle() {
  isOpen.value = !isOpen.value;
}

function onTriggerClick(e: MouseEvent) {
  // a submenu trigger lives inside an item of the parent menu, opening it must not select that item
  if (parentMenu) {
    e.stopPropagation();
  }
  toggle();
}

function flipIfOutsideViewport() {
  const content = contentRef.value!.getBoundingClientRect();
  flipped.value = content.left < VIEWPORT_MARGIN || content.right > window.innerWidth - VIEWPORT_MARGIN;
}

// fixed positioning for teleported content, so menus inside scroll containers (tables) are not clipped
function placeFixed() {
  const trigger = rootRef.value!.getBoundingClientRect();
  const content = contentRef.value!.getBoundingClientRect();
  const sideways = props.placement === 'left-start' || props.placement === 'right-start';

  let left: number;
  let top: number;
  let maxHeight = window.innerHeight - 2 * VIEWPORT_MARGIN;
  if (sideways) {
    left = props.placement === 'left-start' ? trigger.left - GAP - content.width : trigger.right + GAP;
    top = Math.min(trigger.top, window.innerHeight - VIEWPORT_MARGIN - content.height);
  } else {
    left = props.placement === 'bottom-start' ? trigger.left : trigger.right - content.width;
    const spaceBelow = window.innerHeight - trigger.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = trigger.top - GAP - VIEWPORT_MARGIN;
    const below = content.height <= spaceBelow || spaceBelow >= spaceAbove;
    maxHeight = below ? spaceBelow : spaceAbove;
    top = below ? trigger.bottom + GAP : trigger.top - GAP - Math.min(content.height, maxHeight);
  }
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - content.width);

  fixedStyle.value = {
    top: `${Math.round(Math.max(VIEWPORT_MARGIN, top))}px`,
    left: `${Math.round(Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft))}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
  };
}

function onDocumentMousedown(e: MouseEvent) {
  const target = e.target as Node;
  if (rootRef.value?.contains(target) || contentRef.value?.contains(target)) {
    return;
  }
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close();
  }
}

function onViewportChange(e: Event) {
  // scrolling inside the menu itself must not close it
  if (e.target instanceof Node && contentRef.value?.contains(e.target)) {
    return;
  }
  close();
}

function addListeners() {
  document.addEventListener('mousedown', onDocumentMousedown);
  document.addEventListener('keydown', onKeydown);
  if (props.teleportToBody) {
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
  }
}

function removeListeners() {
  document.removeEventListener('mousedown', onDocumentMousedown);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange);
}

watch(isOpen, async (opened) => {
  if (!opened) {
    removeListeners();
    return;
  }
  addListeners();
  measuring.value = true;
  flipped.value = false;
  await nextTick();
  if (props.teleportToBody) {
    placeFixed();
    // icons and web fonts can change the content width right after the first paint
    requestAnimationFrame(() => isOpen.value && placeFixed());
  } else {
    flipIfOutsideViewport();
  }
  measuring.value = false;
});

onBeforeUnmount(removeListeners);

defineExpose({ open, close, toggle });
</script>
