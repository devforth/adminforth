<template>
  <div class="relative w-full">
    <component 
      v-if="!loading"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <BreadcrumbsWithButtons>
      <template v-if="coreStore.resource?.options?.actions">

        <template  v-for="action in coreStore.resource.options.actions.filter(a => a.showIn?.showButton)" :key="action.id">
          <component
            :is="action?.customComponent ? getCustomComponent(action.customComponent) : CallActionWrapper"
            :meta="action.customComponent?.meta"
            @callAction="(payload?) => startCustomAction(action.id, payload)"
            :disabled="actionLoadingStates[action.id]"
          >
            <button 
              :key="action.id"
              :disabled="actionLoadingStates[action.id!]"
              class="flex items-center py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              <component 
                v-if="action.icon" 
                :is="getIcon(action.icon)" 
                class="w-4 h-4 me-2 text-lightPrimary dark:text-darkPrimary"
              />
              {{ action.name }}
            </button>
          </component>
        </template>
      </template>
      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="af-add-new-button flex items-center py-1 px-3 text-sm font-medium text-lightShowViewButtonText focus:outline-none bg-lightShowViewButtonBackground rounded border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-lightShowViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-darkShowViewButtonText dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover rounded-default gap-1"
      >
        <IconPlusOutline class="w-4 h-4"/>
        {{ $t('Add new') }}
      </RouterLink>

      <RouterLink v-if="coreStore?.resourceOptions?.allowedActions?.edit" :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center af-edit-button py-1 px-3 text-sm font-medium text-lightShowViewButtonText focus:outline-none bg-lightShowViewButtonBackground rounded-default border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-lightShowViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-darkShowViewButtonText dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover gap-1"
      >
        <IconPenSolid class="w-4 h-4" />
        {{ $t('Edit') }}
      </RouterLink>

      <button v-if="coreStore?.resourceOptions?.allowedActions?.delete"  @click="deleteRecord"
        class="flex items-center af-delete-button py-1 px-3 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-lightShowViewButtonBackground  border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-red-500 dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover gap-1"
      >
        <IconTrashBinSolid class="w-4 h-4" />
        {{ $t('Delete') }}
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.show?.threeDotsDropdownItems as [])"
        :customActions="customActions"
      ></ThreeDotsMenu>
    </BreadcrumbsWithButtons>

    <component 
      v-if="!loading"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <div v-if="loading" role="status" class="max-w-sm animate-pulse">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
        <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
        <span class="sr-only">{{ $t('Loading...') }}</span>
    </div>
    <div 
      v-else-if="coreStore.record"
      class="relative w-full flex flex-col gap-4"
    >
    <div v-if="!groups.length && allColumns?.length">
      <ShowTable
        :resource="coreStore.resource"
        :record="coreStore.record"
        :columns="allColumns as Array<{ name: string; label?: string; components?: any }>"
      />
    </div>
    <template v-else> 
      <template v-for="group in groups" :key="group.groupName">
        <ShowTable
          :columns="group.columns"
          :groupName="group.groupName"
          :noTitle="group.noTitle"
          :resource="coreStore.resource"
          :record="coreStore.record"
        />
      </template>
      <template v-if="otherColumns && otherColumns.length > 0">
        <ShowTable
          groupName="Other Fields"
          :resource="coreStore.resource"
          :record="coreStore.record"
          :columns="otherColumns as Array<{ name: string; label?: string; components?: any }>"
        />
      </template>
    </template>
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 mt-10">
      {{ $t('Ooops. Record not found') }}
    </div>

    <component 
      v-if="!loading"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.bottom || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />


  </div>
</template>


<script setup lang="ts">

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';

import { useCoreStore } from '@/stores/core';
import { getCustomComponent, checkAcessByAllowedActions, initThreeDotsDropdown } from '@/utils';
import { IconPenSolid, IconTrashBinSolid, IconPlusOutline } from '@iconify-prerendered/vue-flowbite';
import { onMounted, ref, computed } from 'vue';
import { useRoute,useRouter } from 'vue-router';
import {callAdminForthApi} from '@/utils';
import { showSuccesTost, showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import ShowTable from '@/components/ShowTable.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { getIcon } from '@/utils';
import { type AdminForthComponentDeclarationFull, type AdminForthResourceColumnCommon, type FieldGroup } from '@/types/Common.js';
import CallActionWrapper from '@/components/CallActionWrapper.vue'

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const { t } = useI18n();
const { confirm, alert, show } = useAdminforth();
const coreStore = useCoreStore();

const actionLoadingStates = ref<Record<string, boolean>>({});

const customActions = computed(() => {
  return coreStore.resource?.options?.actions?.filter((a: any) => a.showIn?.showThreeDotsMenu) || [];
});

onMounted(async () => {
  loading.value = true;
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId as string,
  });
  initThreeDotsDropdown();
  await coreStore.fetchRecord({
    resourceId: route.params.resourceId as string, 
    primaryKey: route.params.primaryKey as string,
    source: 'show',
  });
  if(coreStore.resourceOptions){
    checkAcessByAllowedActions(coreStore.resourceOptions.allowedActions,'show');
  }
  loading.value = false;
});

const groups = computed(() => {
  let fieldGroupType;
  if (coreStore.resource) {
    if (coreStore.resource.options?.showFieldGroups) {
      fieldGroupType = coreStore.resource.options.showFieldGroups;
    } else if (coreStore.resource.options?.showFieldGroups === null) {
      fieldGroupType = [];
    } else {
      fieldGroupType = coreStore.resource.options?.fieldGroups;
    }
  }
  const activeGroups: typeof fieldGroupType | [] = fieldGroupType ?? [];

  return activeGroups.map((group: FieldGroup) => ({
    ...group,
    columns: coreStore.resource?.columns.filter(
      col => group.columns.includes(col.name) && col.showIn?.show
    ),
  }));
});

const allColumns = computed(() => {
  return coreStore.resource?.columns.filter(col => col.showIn?.show);
});

const otherColumns = computed(() => {
  const groupedColumnNames = new Set(
    groups.value.flatMap(group => group.columns?.map((col: AdminForthResourceColumnCommon) => col.name))
  );

  return coreStore.resource?.columns.filter(
    col => !groupedColumnNames.has(col.name) && col.showIn?.show
  );
});

async function deleteRecord() {
  const data = await confirm({
    message: t('Are you sure you want to delete this item?'),
    yes: t('Delete'),
    no: t('Cancel'),
  });
  if (data) {
    try {
      const res = await callAdminForthApi({
      path: '/delete_record',
      method: 'POST',
      body: {
        resourceId: route.params.resourceId,
        primaryKey: route.params.primaryKey,
      }});
      if (!res.error){
        router.push({ name: 'resource-list', params: { resourceId: route.params.resourceId } });
        showSuccesTost(t('Record deleted successfully'))
      } else {
        showErrorTost(res.error)
      }

    } catch (e) {
      console.error(e);
    };
  }
    
}

async function startCustomAction(actionId: string, extra: any) {  
  actionLoadingStates.value[actionId] = true;

  const data = await callAdminForthApi({
    path: '/start_custom_action',
    method: 'POST',
    body: {
      resourceId: route.params.resourceId,
      actionId: actionId,
      recordId: route.params.primaryKey,
      extra: extra,
    }
  });
  
  actionLoadingStates.value[actionId] = false;
  
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
    showErrorTost(data.error);
  }
}

show.refresh = () => {
  (async () => {
    try {
      loading.value = true;
      await coreStore.fetchRecord({
        resourceId: String(route.params.resourceId),
        primaryKey: String(route.params.primaryKey),
        source: 'show',
      });
    } catch (e) {
      showErrorTost((e as Error).message);
    } finally {
      loading.value = false;
    }
  })();
}

</script>
