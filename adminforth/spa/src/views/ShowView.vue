<template>
  <div class="relative w-full">
    <component 
      v-if="!loading"
      v-for="c in coreStore?.resourceOptions?.pageInjections?.show?.beforeBreadcrumbs || []"
      :is="getCustomComponent(formatComponent(c as AdminForthComponentDeclarationFull))"
      :meta="formatComponent(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />
    <BreadcrumbsWithButtons>
      <template v-if="coreStore.resource?.options?.actions">

        <div class="flex gap-1" v-for="action in coreStore.resource.options.actions.filter(a => a.showIn?.showButton)" :key="action.id">
          <component
            :is="action?.customComponent ? getCustomComponent(formatComponent(action.customComponent)) : CallActionWrapper"
            :meta="action.customComponent ? formatComponent(action.customComponent).meta : undefined"
            @callAction="(payload?: any) => startCustomAction(action.id, payload)"
            :disabled="actionLoadingStates[action.id]"
          >
            <button 
              :key="action.id"
              :disabled="actionLoadingStates[action.id!]"
              class="flex items-center af-button-shadow h-[34px] py-1 px-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-default border border-gray-300 hover:bg-gray-100 hover:text-lightPrimary focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              <component 
                v-if="action.icon && !actionLoadingStates[action.id!]" 
                :is="getIcon(action.icon)" 
                class="w-4 h-4 me-2 text-lightPrimary dark:text-darkPrimary"
              />
              <Spinner
                v-if="actionLoadingStates[action.id!]"
                class="w-5 h-5 me-2 text-gray-200 dark:text-gray-500 fill-gray-500 dark:fill-gray-300"
              />
              {{ action.name }}
            </button>
          </component>
        </div>
      </template>
      <RouterLink v-if="coreStore.resource?.options?.allowedActions?.create"
        :to="{ name: 'resource-create', params: { resourceId: $route.params.resourceId } }"
        class="af-add-new-button af-button-shadow h-[34px] flex items-center py-1 px-3 text-sm font-medium text-lightShowViewButtonText focus:outline-none bg-lightShowViewButtonBackground rounded border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-lightShowViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-darkShowViewButtonText dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover rounded-default gap-1"
      >
        <IconPlusOutline class="w-4 h-4"/>
        {{ $t('Add new') }}
      </RouterLink>

      <RouterLink v-if="coreStore?.resourceOptions?.allowedActions?.edit" :to="{ name: 'resource-edit', params: { resourceId: $route.params.resourceId, primaryKey: $route.params.primaryKey } }" 
        class="flex items-center h-[34px] af-button-shadow af-edit-button py-1 px-3 text-sm font-medium text-lightShowViewButtonText focus:outline-none bg-lightShowViewButtonBackground rounded-default border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-lightShowViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-darkShowViewButtonText dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover gap-1"
      >
        <IconPenSolid class="w-4 h-4" />
        {{ $t('Edit') }}
      </RouterLink>

      <button v-if="coreStore?.resourceOptions?.allowedActions?.delete"  @click="deleteRecord"
        class="flex items-center h-[34px] af-button-shadow af-delete-button py-1 px-3 text-sm font-medium rounded-default text-red-600 focus:outline-none bg-lightShowViewButtonBackground  border border-lightShowViewButtonBorder hover:bg-lightShowViewButtonBackgroundHover hover:text-red-700 focus:z-10 focus:ring-4 focus:ring-lightShowViewButtonFocusRing dark:focus:ring-darkShowViewButtonFocusRing dark:bg-darkShowViewButtonBackground dark:text-red-500 dark:border-darkShowViewButtonBorder dark:hover:text-darkShowViewButtonTextHover dark:hover:bg-darkShowViewButtonBackgroundHover gap-1"
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
      :is="getCustomComponent(formatComponent(c as AdminForthComponentDeclarationFull))"
      :meta="formatComponent(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <div 
      v-if="loading" 
      role="status" 
      class="animate-pulse overflow-x-auto shadow-resourseFormShadow dark:shadow-darkResourseFormShadow"
    >
      <div 
        v-if="groups && groups.length > 0" 
        class="text-md font-semibold px-6 py-3 flex flex-1 items-center bg-lightShowTableHeadingBackground dark:bg-darkShowTableHeadingBackground dark:text-darkShowTableHeadingText rounded-t-lg border-b border-lightShowTableBodyBorder dark:border-darkShowTableBodyBorder"
      >
        <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
      </div>

      <table class="w-full text-sm text-left table-fixed">
        <thead class="bg-lightShowTableUnderHeadingBackground dark:bg-darkShowTableUnderHeadingBackground block md:table-row-group">
          <tr>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:w-52 md:table-cell text-lightShowTableUnderHeadingText dark:text-darkShowTableUnderHeadingText">
              {{ $t('Field') }}
            </th>
            <th scope="col" class="px-6 py-3 text-xs uppercase hidden md:table-cell text-lightShowTableUnderHeadingText dark:text-darkShowTableUnderHeadingText">
              {{ $t('Value') }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr 
            v-for="i in skeletonRowsCount" 
            :key="i"
            class="bg-lightShowTablesBodyBackground border-t border-lightShowTableBodyBorder dark:bg-darkShowTablesBodyBackground dark:border-darkShowTableBodyBorder block md:table-row"
          >
            <td class="px-6 py-[15.5px] relative block md:table-cell pb-0 md:pb-[15.5px]">
              <div class="md:absolute md:inset-0 flex items-center px-6 py-[15.5px]">
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
              </div>
            </td>

            <td class="px-6 py-[15.5px] whitespace-pre-wrap block md:table-cell">
              <div class="flex items-center h-full min-h-[21px]">
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full max-w-[280px]"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

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
          :columns="group.columns as any"
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
      :is="getCustomComponent(formatComponent(c as AdminForthComponentDeclarationFull))"
      :meta="formatComponent(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />


  </div>
</template>


<script setup lang="ts">

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';

import { useCoreStore } from '@/stores/core';
import { getCustomComponent, checkAcessByAllowedActions, initThreeDotsDropdown, formatComponent, executeCustomAction } from '@/utils';
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
import { Spinner } from '@/afcl';

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

const skeletonRowsCount = computed(() => {
  const allCols = coreStore.resource?.columns || [];

  const isEnabledInConfig = (col: any) => {
    return col.showIn?.list !== false;
  };
  
  const finalCount = allCols.filter(isEnabledInConfig).length;

  return finalCount > 0 ? finalCount : 10;
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
  return coreStore.resource?.columns?.filter(col => col.showIn?.show);
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

async function startCustomAction(actionId: string, extra?: any) {  
  await executeCustomAction({
    actionId,
    resourceId: route.params.resourceId as string,
    recordId: route.params.primaryKey as string,
    extra,
    setLoadingState: (loading: boolean) => {
      actionLoadingStates.value[actionId] = loading;
    },
    onSuccess: async (data: any) => {
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
      showErrorTost(error);
    }
  });
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
