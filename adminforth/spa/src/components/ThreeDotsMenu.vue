<template >
  <div class="relative" v-if="threeDotsDropdownItems?.length || customActions?.length || (bulkActions?.some((action: AdminForthBulkActionFront) => action.showInThreeDotsDropdown))">
    <button 
      ref="buttonTriggerRef"
      @click="toggleDropdownVisibility"
      class="flex transition-all items-center af-button-shadow py-2.5 px-2.5 text-sm font-medium text-lightThreeDotsMenuIconDots focus:outline-none bg-lightThreeDotsMenuIconBackground rounded border border-lightThreeDotsMenuIconBackgroundBorder hover:bg-lightThreeDotsMenuIconBackgroundHover hover:text-lightThreeDotsMenuIconDotsHover focus:z-10 focus:ring-4 focus:ring-lightThreeDotsMenuIconFocus dark:focus:ring-darkThreeDotsMenuIconFocus dark:bg-darkThreeDotsMenuIconBackground dark:text-darkThreeDotsMenuIconDots dark:border-darkThreeDotsMenuIconBackgroundBorder dark:hover:text-darkThreeDotsMenuIconDotsHover dark:hover:bg-darkThreeDotsMenuIconBackgroundHover rounded-default"
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
      class="absolute z-30 mt-3 bg-lightThreeDotsMenuBodyBackground divide-y divide-gray-100 rounded-lg shadow w-max max-w-64 dark:bg-darkThreeDotsMenuBodyBackground dark:divide-gray-600 right-0">
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
              <div class="wrapper" v-if="getCustomComponent(item)">
                <component 
                  :ref="(el: any) => setComponentRef(el, i)" :is="getCustomComponent(item)!"
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
                :is="(action.customComponent && getCustomComponent(formatComponent(action.customComponent))) || CallActionWrapper"
                :meta="formatComponent(action.customComponent).meta"
                @callAction="(payload? : Object) => handleActionClick(action, payload)"
              >
                <a @click.prevent class="block">
                  <div class="flex items-center gap-2">
                    <component 
                      v-if="action.icon && !actionLoadingStates[action.id!]" 
                      :is="getIcon(action.icon)" 
                      class="w-4 h-4 text-lightPrimary dark:text-darkPrimary"
                    />
                    <div v-if="actionLoadingStates[action.id!]">
                      <svg 
                        aria-hidden="true" 
                        class="w-4 h-4 animate-spin text-gray-200 dark:text-gray-500 fill-gray-500 dark:fill-gray-300" 
                        viewBox="0 0 100 101" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                      </svg>
                      <span class="sr-only">Loading...</span>
                    </div>
                    {{ action.name }}
                  </div>
                </a>
              </component>
            </div>
          </li>
          <li v-for="action in (bulkActions ?? []).filter(a => a.showInThreeDotsDropdown)" :key="action.id">
            <a @click.prevent="startBulkAction(action.id)" 
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
import { getCustomComponent, getIcon, formatComponent, executeCustomAction } from '@/utils';
import { useCoreStore } from '@/stores/core';
import { useAdminforth } from '@/adminforth';
import { callAdminForthApi } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import CallActionWrapper from '@/components/CallActionWrapper.vue'
import { ref, type ComponentPublicInstance, onMounted, onUnmounted } from 'vue';
import type { AdminForthActionFront, AdminForthBulkActionFront, AdminForthComponentDeclarationFull } from '@/types/Common';
import type { AdminForthActionInput } from '@/types/Back';

const { list, alert} = useAdminforth();
const route = useRoute();
const coreStore = useCoreStore();
const router = useRouter();
const threeDotsDropdownItemsRefs = ref<Array<ComponentPublicInstance | null>>([]);
const showDropdown = ref(false);
const actionLoadingStates = ref<Record<string, boolean>>({});
const dropdownRef = ref<HTMLElement | null>(null);
const buttonTriggerRef = ref<HTMLElement | null>(null);

const props = defineProps({
  threeDotsDropdownItems: Array<AdminForthComponentDeclarationFull>,
  customActions: Array<AdminForthActionFront>,
  bulkActions: Array<AdminForthBulkActionFront>,
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
  await executeCustomAction({
    actionId: action.id,
    resourceId: route.params.resourceId as string,
    recordId: route.params.primaryKey as string,
    extra: payload || {},
    setLoadingState: (loading: boolean) => {
      actionLoadingStates.value[action.id!] = loading;
    },
    onSuccess: async (data: any) => {
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
    },
    onError: (error: string) => {
      alert({
        message: error,
        variant: 'danger'
      });
    }
  });
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
  .wrapper {
    @apply px-4 py-2 
    hover:text-lightThreeDotsMenuBodyTextHover hover:bg-lightThreeDotsMenuBodyBackgroundHover 
    dark:hover:bg-darkThreeDotsMenuBodyBackgroundHover dark:hover:text-darkThreeDotsMenuBodyTextHover
    cursor-pointer;
  }
</style>

