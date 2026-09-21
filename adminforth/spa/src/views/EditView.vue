<template>
  <div class="relative w-full">
    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.beforeBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <Button @click="() => {cancelButtonClicked = true; $router.back()}"
        class="h-[2.125rem] px-3 mr-2 text-lightEditViewButtonText dark:text-darkEditViewButtonText"
        variant="secondary"
      >
        {{ $t('Cancel') }}
      </Button>
      <Button
        @click="() => saveRecord()"
        class="h-[2.125rem] px-3 text-sm text-lightEditViewSaveButtonText hover:text-lightEditViewSaveButtonTextHover dark:text-darkEditViewSaveButtonText dark:hover:text-darkEditViewSaveButtonTextHover"
        :disabled="saving || (validatingMode && !isValid) || resourceFormRef?.isValidating"
        variant="secondary"
      >
        <Spinner v-if="saving || resourceFormRef?.isValidating" class="w-4 h-4" />
        <IconFloppyDiskSolid v-else class="w-4 h-4" />
        {{ $t('Save') }}
      </Button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.edit?.threeDotsDropdownItems as [])"
      ></ThreeDotsMenu>

    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.afterBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <CreateEditSkeleton :resource="coreStore.resource" v-if="loading"></CreateEditSkeleton>
 
    <ResourceForm 
      v-else-if="coreStore.resource"
      ref="resourceFormRef"
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
      @update:record="onUpdateRecord"
      @update:isValid="isValid = $event"
      :validatingMode="validatingMode"
      :source="'edit'"
    >
    </ResourceForm>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.bottom as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

  </div>
</template>


<script setup lang="ts">

import BreadcrumbsWithButtons from '@/components/BreadcrumbsWithButtons.vue';
import ResourceForm from '@/components/ResourceForm.vue';
import SingleSkeletLoader from '@/components/SingleSkeletLoader.vue';
import { useCoreStore } from '@/stores/core';
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions, initThreeDotsDropdown, compareOldAndNewRecord, generateMessageHtmlForRecordChange, leaveGuardActiveClass, onBeforeRouteLeaveCreateEditViewGuard } from '@/utils';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';
import { computed, onMounted, onBeforeMount, ref, type Ref, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { formatComponent } from '@/utils';
import { type AdminForthComponentDeclaration, type AdminForthComponentDeclarationFull } from '@/types/Common.js';
import type { AdminForthResourceColumn } from '@/types/Back';
import { scrollToInvalidField, saveRecordPreparations } from '@/utils';
import { Spinner, Button, LinkButton } from '@/afcl'
import CreateEditSkeleton from './CreateEditSkeleton.vue';

const { t } = useI18n();
const coreStore = useCoreStore();
const { clearSaveInterceptors, runSaveInterceptors, alert, confirm } = useAdminforth();

const isValid = ref(false);
const validatingMode = ref(false);

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const saving = ref(false);

const record: Ref<Record<string, any>> = ref({});

const initialRecord = computed(() => coreStore.record);
const wasSaveSuccessful = ref(false);
const cancelButtonClicked = ref(false);
const useLeaveGuard = ref( false );
  
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!useLeaveGuard.value) {
    return;
  }
  if (!checkIfWeCanLeavePage()) {
    event.preventDefault();
    event.returnValue = '';
  }
}

function checkIfWeCanLeavePage() {
  return wasSaveSuccessful.value || cancelButtonClicked.value || compareOldAndNewRecord(initialRecord.value, record.value).ok === false;
}

window.addEventListener('beforeunload', onBeforeUnload);

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});

const leaveGuardActive = new leaveGuardActiveClass();
onBeforeRouteLeaveCreateEditViewGuard(initialRecord, record, checkIfWeCanLeavePage, leaveGuardActive, useLeaveGuard);

const resourceFormRef = ref<InstanceType<typeof ResourceForm> | null>(null);

async function onUpdateRecord(newRecord: Record<string, any>) {
  record.value = newRecord;
}

const editableRecord = computed(() => {
  const newRecord = { ...coreStore.record };
  if (!coreStore.resource) {
    return {};
  }
  coreStore.resource.columns.forEach(column => {
    if (column.foreignResource) {
      if (column.isArray?.enabled) {
        newRecord[column.name] = newRecord[column.name]?.map((fr: { pk: any }) => fr?.pk);
      } else {
        newRecord[column.name] = newRecord[column.name]?.pk;
      }
    }
  });
  return newRecord;
})

onBeforeMount(() => {
  clearSaveInterceptors(route.params.resourceId as string);
});

onMounted(async () => {
  useLeaveGuard.value = coreStore.resource?.options?.dontShowWarningAboutUnsavedChanges !== true;
  loading.value = true;

  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId as string 
  });
  initThreeDotsDropdown();

  await coreStore.fetchRecord({
    resourceId: route.params.resourceId as string,
    primaryKey: route.params.primaryKey as string,
    source: 'edit',
  });

  if (coreStore.resourceOptions) {
    checkAcessByAllowedActions(coreStore.resourceOptions.allowedActions,'edit');
  }

  loading.value = false;
});

async function saveRecord() {

  const interceptorsResult = await saveRecordPreparations(
    'edit', 
    validatingMode, 
    resourceFormRef, 
    isValid, 
    t, 
    saving, 
    runSaveInterceptors, 
    record, 
    coreStore, 
    route
  );

  if (!interceptorsResult.ok) {
    saving.value = false;
    if (interceptorsResult.error) showErrorTost(interceptorsResult.error);
    return;
  }
  const interceptorConfirmationResult = interceptorsResult.extra?.confirmationResult;
  const updates: Record<string, any> = {};
  for (const key in record.value) {
    let columnIsUpdated = false;

    if (typeof record.value[key] !== typeof coreStore.record[key]) {
      columnIsUpdated = true;
    } else if (typeof record.value[key] === 'object') {
      columnIsUpdated = JSON.stringify(record.value[key]) !== JSON.stringify(coreStore.record[key]);
    } else {
      columnIsUpdated = record.value[key] !== coreStore.record[key];
    }

    if (!coreStore.resource) return;
      const column = coreStore.resource.columns.find((c) => c.name === key);

    if (column?.foreignResource) {
      columnIsUpdated = record.value[key] !== coreStore.record[key]?.pk;
    }

    if (columnIsUpdated) {
      updates[key] = record.value[key];
    }
  }
  let resp = null;
  try {
    resp = await callAdminForthApi({
      method: 'POST',
      path: `/update_record`,
      body: {
        resourceId: route.params.resourceId,
        recordId: route.params.primaryKey,
        record: updates,
        meta: {
          ...(interceptorConfirmationResult ? { confirmationResult: interceptorConfirmationResult } : {}),
        },
      },
    });
  } finally {
    saving.value = false;
  }
  if (resp.error && resp.error !== 'Operation aborted by hook') {
    showErrorTost(resp.error);
  } else {
    wasSaveSuccessful.value = true;
    alert({
      message: t('Record updated successfully'),
      variant: 'success',
      timeout: 10
    });
    router.push({ name: 'resource-show', params: { resourceId: route.params.resourceId, primaryKey: resp.recordId } });
  }
  saving.value = false;
}

</script>