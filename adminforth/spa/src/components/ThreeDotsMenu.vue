<template >
  <div class="relative" v-if="threeDotsDropdownItems?.length || customActions?.length || (bulkActions?.some((action: AdminForthBulkActionCommon) => action.showInThreeDotsDropdown))">
    <button 
      ref="buttonTriggerRef"
      @click="toggleDropdownVisibility"
      class="flex items-center py-2 px-2 text-sm font-medium text-lightThreeDotsMenuIconDots focus:outline-none bg-lightThreeDotsMenuIconBackground rounded border border-lightThreeDotsMenuIconBackgroundBorder hover:bg-lightThreeDotsMenuIconBackgroundHover hover:text-lightThreeDotsMenuIconDotsHover focus:z-10 focus:ring-4 focus:ring-lightThreeDotsMenuIconFocus dark:focus:ring-darkThreeDotsMenuIconFocus dark:bg-darkThreeDotsMenuIconBackground dark:text-darkThreeDotsMenuIconDots dark:border-darkThreeDotsMenuIconBackgroundBorder dark:hover:text-darkThreeDotsMenuIconDotsHover dark:hover:bg-darkThreeDotsMenuIconBackgroundHover rounded-default"
    >
      <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
      </svg>
    </button>

    <!-- Dropdown menu -->
    <div 
      ref="dropdownRef"
      :class="{
        'block': showDropdown,
        'hidden': !showDropdown,
        'left-0 md:left-auto': checkboxes && checkboxes.length > 0
      }"
      class="absolute z-30 mt-3 bg-lightThreeDotsMenuBodyBackground divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-darkThreeDotsMenuBodyBackground dark:divide-gray-600 right-0">
        <ul class="py-2 text-sm text-lightThreeDotsMenuBodyText dark:text-darkThreeDotsMenuBodyText" aria-labelledby="dropdownMenuIconButton">
          <li v-for="(item, i) in threeDotsDropdownItems" :key="`dropdown-item-${i}`">
            <div  
              class="block hover:bg-lightThreeDotsMenuBodyBackgroundHover hover:text-lightThreeDotsMenuBodyTextHover dark:hover:bg-darkThreeDotsMenuBodyBackgroundHover dark:hover:text-darkThreeDotsMenuBodyTextHover"
              :class="{
                'pointer-events-none': checkboxes && checkboxes.length === 0 && item.meta?.disabledWhenNoCheckboxes,
                'opacity-50': checkboxes && checkboxes.length === 0 && item.meta?.disabledWhenNoCheckboxes,
                'cursor-not-allowed': checkboxes && checkboxes.length === 0 && item.meta?.disabledWhenNoCheckboxes,
              }"
              @click="injectedComponentClick(i)"
            >
              <div class="wrapper">
                <component 
                  :ref="(el: any) => setComponentRef(el, i)" :is="getCustomComponent(item)"
                  :meta="item.meta" 
                  :resource="coreStore.resource" 
                  :adminUser="coreStore.adminUser"
                  :checkboxes="checkboxes"
                  :updateList="props.updateList"
                  :clearCheckboxes="clearCheckboxes"
                />
              </div>
            </div>
          </li>
          <li v-for="action in customActions" :key="action.id">
            <div class="wrapper"> 
              <component
                :is="(action.customComponent && getCustomComponent(action.customComponent)) || CallActionWrapper"
                :meta="action.customComponent?.meta"
                @callAction="(payload? : Object) => handleActionClick(action, payload)"
              >
                <a href="#" @click.prevent class="block px-4 py-2 hover:text-lightThreeDotsMenuBodyTextHover hover:bg-lightThreeDotsMenuBodyBackgroundHover dark:hover:bg-darkThreeDotsMenuBodyBackgroundHover dark:hover:text-darkThreeDotsMenuBodyTextHover">
                  <div class="flex items-center gap-2">
                    <component 
                      v-if="action.icon" 
                      :is="getIcon(action.icon)" 
                      class="w-4 h-4 text-lightPrimary dark:text-darkPrimary"
                    />
                    {{ action.name }}
                  </div>
                </a>
              </component>
            </div>
          </li>
          <li v-for="action in (bulkActions ?? []).filter(a => a.showInThreeDotsDropdown)" :key="action.id">
            <a href="#" @click.prevent="startBulkAction(action.id)" 
                class="block px-4 py-2 hover:text-lightThreeDotsMenuBodyTextHover hover:bg-lightThreeDotsMenuBodyBackgroundHover dark:hover:bg-darkThreeDotsMenuBodyBackgroundHover dark:hover:text-darkThreeDotsMenuBodyTextHover"
                :class="{
                  'pointer-events-none': checkboxes && checkboxes.length === 0,
                  'opacity-50': checkboxes && checkboxes.length === 0,
                  'cursor-not-allowed': checkboxes && checkboxes.length === 0
                }">
              <div class="flex items-center gap-2">
                <component 
                  v-if="action.icon" 
                  :is="getIcon(action.icon)" 
                  class="w-4 h-4 text-lightPrimary dark:text-darkPrimary"
                />
                {{ action.label }}
              </div>
            </a>
          </li>
        </ul>
    </div>
  </div>
</template>


<script setup lang="ts">
import { getCustomComponent, getIcon } from '@/utils';
import { useCoreStore } from '@/stores/core';
import { useAdminforth } from '@/adminforth';
import { callAdminForthApi } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import CallActionWrapper from '@/components/CallActionWrapper.vue'
import { ref, type ComponentPublicInstance, onMounted, onUnmounted } from 'vue';
import type { AdminForthBulkActionCommon, AdminForthComponentDeclarationFull } from '@/types/Common';
import type { AdminForthActionInput } from '@/types/Back';

const { list, alert} = useAdminforth();
const route = useRoute();
const coreStore = useCoreStore();
const router = useRouter();
const threeDotsDropdownItemsRefs = ref<Array<ComponentPublicInstance | null>>([]);
const showDropdown = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonTriggerRef = ref<HTMLElement | null>(null);

const props = defineProps({
  threeDotsDropdownItems: Array<AdminForthComponentDeclarationFull>,
  customActions: Array<AdminForthActionInput>,
  bulkActions: Array<AdminForthBulkActionCommon>,
  checkboxes: Array,
  updateList: {
    type: Function,
  },
  clearCheckboxes: {
    type: Function
  }
});

const emit = defineEmits(['startBulkAction']);

function setComponentRef(el: ComponentPublicInstance | null, index: number) {
  if (el) {
    threeDotsDropdownItemsRefs.value[index] = el;
  }
}

async function handleActionClick(action: AdminForthActionInput, payload: any) {
  list.closeThreeDotsDropdown();
  
  const actionId = action.id;
  const data = await callAdminForthApi({
    path: '/start_custom_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordId: route.params.primaryKey,
      extra: payload || {},
    }
  });

  if (data?.redirectUrl) {
    // Check if the URL should open in a new tab
    if (data.redirectUrl.includes('target=_blank')) {
      window.open(data.redirectUrl.replace('&target=_blank', '').replace('?target=_blank', ''), '_blank');
    } else {
      // Navigate within the app
      if (data.redirectUrl.startsWith('http')) {
        window.location.href = data.redirectUrl;
      } else {
        router.push(data.redirectUrl);
      }
    }
    return;
  }
  
  if (data?.ok) {
    await coreStore.fetchRecord({
      resourceId: route.params.resourceId as string, 
      primaryKey: route.params.primaryKey as string,
      source: 'show',
    });

    if (data.successMessage) {
      alert({
        message: data.successMessage,
        variant: 'success'
      });
    }
  }
  
  if (data?.error) {
    alert({
      message: data.error,
      variant: 'danger'
    });
  }
}

function startBulkAction(actionId: string) {
  list.closeThreeDotsDropdown();
  emit('startBulkAction', actionId);
  showDropdown.value = false;
}

async function injectedComponentClick(index: number) {
  const componentRef = threeDotsDropdownItemsRefs.value[index];
  if (componentRef && 'click' in componentRef) {
    (componentRef as any).click?.();
  }
  showDropdown.value = false;
}

function toggleDropdownVisibility() {
  showDropdown.value = !showDropdown.value;
}

function handleClickOutside(e: MouseEvent) {
  if (!dropdownRef.value) return

  if (!dropdownRef.value.contains(e.target as Node) && !buttonTriggerRef.value?.contains(e.target as Node)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

</script>

<style lang="scss" scoped>
  .wrapper > * {
    @apply px-4 py-2;
  }
</style>

