<template>
  <div class="relative w-full">

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.beforeBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <Button @click="() => {cancelButtonClicked = true; $router.back()}"
        class="af-cancel-button h-[2.125rem] px-3"
        variant="secondary"
      >
        {{ $t('Cancel') }}
      </Button>
      <Button  
        @click="() => saveRecord()"
        class="af-save-button h-[2.125rem] px-3 text-lightCreateViewSaveButtonText hover:text-lightCreateViewSaveButtonTextHover dark:text-darkCreateViewSaveButtonText dark:hover:text-darkCreateViewSaveButtonTextHover"
        variant="primary"
        :disabled="saving || (validatingMode && !isValid) || resourceFormRef?.isValidating"
      > 
        <Spinner v-if="saving || resourceFormRef?.isValidating" class="w-4 h-4" />
        <IconSave v-else class="w-4 h-4" />
        {{ $t('Save') }}
      </Button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.create?.threeDotsDropdownItems as [])"
      ></ThreeDotsMenu>

    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.afterBreadcrumbs as AdminForthComponentDeclaration[] || []"
      :is="getCustomComponent(formatComponent(c))"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <CreateEditSkeleton v-if="loading"></CreateEditSkeleton>

    
    <ResourceForm 
      v-else
      ref="resourceFormRef"
      :record="record"
      :resource="coreStore.resource!"
      @update:record="onUpdateRecord"
      @update:isValid="isValid = $event"
      :validatingMode="validatingMode"
      :source="'create'"
      :readonlyColumns="readonlyColumns"
    >
    </ResourceForm>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.bottom as AdminForthComponentDeclaration[] || []"
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
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions, compareOldAndNewRecord, onBeforeRouteLeaveCreateEditViewGuard, leaveGuardActiveClass, formatComponent, atob_function } from '@/utils';
import { IconSave } from '@iconify-prerendered/vue-lucide';
import { onMounted, onBeforeMount, onBeforeUnmount, ref  } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { type AdminForthComponentDeclaration, type AdminForthComponentDeclarationFull } from '@/types/Common.js';
import { saveRecordPreparations } from '@/utils';
import { Spinner, Button } from '@/afcl'
import CreateEditSkeleton from './CreateEditSkeleton.vue';

const isValid = ref(false);
const validatingMode = ref(false);

const loading = ref(true);
const saving = ref(false);

const route = useRoute();
const router = useRouter();

const record = ref({});

const coreStore = useCoreStore();
const { clearSaveInterceptors, runSaveInterceptors, alert, confirm } = useAdminforth();

const { t } = useI18n();

const resourceFormRef = ref<InstanceType<typeof ResourceForm> | null>(null);

const initialValues = ref({});

const readonlyColumns = ref([]);

const cancelButtonClicked = ref(false);
const wasSaveSuccessful = ref(false);
const useLeaveGuard = ref( false );

async function onUpdateRecord(newRecord: any) {
  record.value = newRecord;
}

function checkIfWeCanLeavePage() {
  return wasSaveSuccessful.value || cancelButtonClicked.value || compareOldAndNewRecord(initialValues.value, record.value).ok === false;
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!useLeaveGuard.value) {
    return;
  }
  if (!checkIfWeCanLeavePage()) {
    event.preventDefault();
    event.returnValue = '';
  }
}

window.addEventListener('beforeunload', onBeforeUnload);

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});


const leaveGuardActive = new leaveGuardActiveClass();

onBeforeRouteLeaveCreateEditViewGuard(initialValues, record, checkIfWeCanLeavePage, leaveGuardActive, useLeaveGuard);



onBeforeMount(() => {
  clearSaveInterceptors(route.params.resourceId as string);
});

onMounted(async () => {
  useLeaveGuard.value = coreStore.resource?.options?.dontShowWarningAboutUnsavedChanges !== true;

  loading.value = true;
  await coreStore.fetchResourceFull({
    resourceId: route.params.resourceId as string,
    forceFetch: true
  });
  initialValues.value = (coreStore.resource?.columns || []).reduce<Record<string, unknown>>((acc, column) => {
    if (column.suggestOnCreate !== undefined) {
      acc[column.name] = column.suggestOnCreate;
    }
    return acc;
  }, {});
  if (route.query.values) {
    initialValues.value = { ...initialValues.value, ...JSON.parse(atob_function(route.query.values as string)) };
  }
  if (route.query.readonlyColumns) {
    readonlyColumns.value = JSON.parse(atob_function(route.query.readonlyColumns as string));
  }
  record.value = initialValues.value;
  loading.value = false;
  checkAcessByAllowedActions(coreStore.resourceOptions!.allowedActions,'create');
});

async function saveRecord() {
  const interceptorsResult = await saveRecordPreparations(
    'create', 
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

  const interceptorConfirmationResult = (interceptorsResult.extra as Record<string, any>)?.confirmationResult;
  const response = await callAdminForthApi({
    method: 'POST',
    path: `/create_record`,
    body: {
      resourceId: route.params.resourceId,
      record: record.value,
      meta: {
        ...(interceptorConfirmationResult ? { confirmationResult: interceptorConfirmationResult } : {}),
      },
    },
  });
  if (response?.error && response?.error !== 'Operation aborted by hook') {
    showErrorTost(response.error);
  } else {
    saving.value = false;
    wasSaveSuccessful.value = true;
    if (route.query.returnTo) {
      router.push(<string>route.query.returnTo);
    } else {
      router.push({ 
        name: 'resource-show', 
        params: { 
          resourceId: route.params.resourceId, 
          primaryKey: response.redirectToRecordId || response.newRecordId
        } 
      });
      alert({
        message: t('Record created successfully!'),
        variant: 'success'
      });
    }
  }
  saving.value = false;
}

</script>