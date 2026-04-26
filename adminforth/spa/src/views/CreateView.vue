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
      <button @click="() => {cancelButtonClicked = true; $router.back()}"
        class="af-cancel-button h-[2.125rem] af-button-shadow flex items-center py-1 px-3 me-2 text-sm font-medium rounded-default text-lightCreateViewButtonText focus:outline-none bg-lightCreateViewButtonBackground rounded border border-lightCreateViewButtonBorder hover:bg-lightCreateViewButtonBackgroundHover hover:text-lightCreateViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightCreateViewButtonFocusRing dark:focus:ring-darkCreateViewButtonFocusRing dark:bg-darkCreateViewButtonBackground dark:text-darkCreateViewButtonText dark:border-darkCreateViewButtonBorder dark:hover:text-darkCreateViewButtonTextHover dark:hover:bg-darkCreateViewButtonBackgroundHover"
      >
        {{ $t('Cancel') }}
      </button>
      <button  
        @click="() => saveRecord()"
        class="af-save-button h-[2.125rem] af-button-shadow flex items-center py-1 px-3 text-sm font-medium rounded-default text-lightCreateViewSaveButtonText focus:outline-none bg-lightCreateViewButtonBackground rounded border border-lightCreateViewButtonBorder hover:bg-lightCreateViewButtonBackgroundHover hover:text-lightCreateViewSaveButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightCreateViewButtonFocusRing dark:focus:ring-darkCreateViewButtonFocusRing dark:bg-darkCreateViewButtonBackground dark:text-darkCreateViewSaveButtonText dark:border-darkCreateViewButtonBorder dark:hover:text-darkCreateViewSaveButtonTextHover dark:hover:bg-darkCreateViewButtonBackgroundHover disabled:opacity-50 gap-1"
        :disabled="saving || (validatingMode && !isValid) || resourceFormRef?.isValidating"
      > 
        <Spinner v-if="saving || resourceFormRef?.isValidating" class="w-4 h-4" />
        <IconFloppyDiskSolid v-else class="w-4 h-4" />
        {{ $t('Save') }}
      </button>

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
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions, initThreeDotsDropdown, checkShowIf, compareOldAndNewRecord, onBeforeRouteLeaveCreateEditViewGuard, leaveGuardActiveClass, formatComponent } from '@/utils';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';
import { onMounted, onBeforeMount, onBeforeUnmount, ref  } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { type AdminForthComponentDeclaration, type AdminForthComponentDeclarationFull } from '@/types/Common.js';
import { saveRecordPreparations } from '@/utils';
import { Spinner } from '@/afcl'
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
  let userUseMultipleEncoding = true;  //TODO remove this in future versions
  if (route.query.values) {
    try {
      JSON.parse(decodeURIComponent(route.query.values as string));
      console.warn('You are using an outdated format for the query vales. Please update your links and don`t use multiple URL encoding.');
    } catch (e) {
      userUseMultipleEncoding = false;
      console.warn('You are using an outdated format for the query vales. Please update your links and don`t use multiple URL encoding.');
    }
    if (userUseMultipleEncoding) {
      initialValues.value = { ...initialValues.value, ...JSON.parse(decodeURIComponent((route.query.values as string))) };
    } else {
      initialValues.value = { ...initialValues.value, ...JSON.parse(atob(route.query.values as string)) };
    }
  }
  if (route.query.readonlyColumns) {
    if (userUseMultipleEncoding) {
      readonlyColumns.value = JSON.parse(decodeURIComponent((route.query.readonlyColumns as string)));
    } else {
      readonlyColumns.value = JSON.parse(atob(route.query.readonlyColumns as string));
    }
  }
  record.value = initialValues.value;
  loading.value = false;
  checkAcessByAllowedActions(coreStore.resourceOptions!.allowedActions,'create');
  initThreeDotsDropdown();
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

  const requiredColumns = coreStore.resource?.columns.filter(c => c.required?.create === true) || [];
  const requiredColumnsToSkip = requiredColumns.filter(c => checkShowIf(c, record.value, coreStore.resource?.columns || []) === false);  

  const interceptorConfirmationResult = (interceptorsResult.extra as Record<string, any>)?.confirmationResult;
  const response = await callAdminForthApi({
    method: 'POST',
    path: `/create_record`,
    body: {
      resourceId: route.params.resourceId,
      record: record.value,
      requiredColumnsToSkip,
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