<template>
  <div class="relative w-full">

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <button @click="() => {cancelButtonClicked = true; $router.back()}"
        class="af-cancel-button flex items-center py-1 px-3 me-2 text-sm font-medium rounded-default text-lightCreateViewButtonText focus:outline-none bg-lightCreateViewButtonBackground rounded border border-lightCreateViewButtonBorder hover:bg-lightCreateViewButtonBackgroundHover hover:text-lightCreateViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightCreateViewButtonFocusRing dark:focus:ring-darkCreateViewButtonFocusRing dark:bg-darkCreateViewButtonBackground dark:text-darkCreateViewButtonText dark:border-darkCreateViewButtonBorder dark:hover:text-darkCreateViewButtonTextHover dark:hover:bg-darkCreateViewButtonBackgroundHover"
      >
        {{ $t('Cancel') }}
      </button>
      <button  
        @click="() => saveRecord()"
        class="af-save-button flex items-center py-1 px-3 text-sm font-medium rounded-default text-lightCreateViewSaveButtonText focus:outline-none bg-lightCreateViewButtonBackground rounded border border-lightCreateViewButtonBorder hover:bg-lightCreateViewButtonBackgroundHover hover:text-lightCreateViewSaveButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightCreateViewButtonFocusRing dark:focus:ring-darkCreateViewButtonFocusRing dark:bg-darkCreateViewButtonBackground dark:text-darkCreateViewSaveButtonText dark:border-darkCreateViewButtonBorder dark:hover:text-darkCreateViewSaveButtonTextHover dark:hover:bg-darkCreateViewButtonBackgroundHover disabled:opacity-50 gap-1"
        :disabled="saving || (validating && !isValid)"
      > 
        <svg v-if="saving"
         aria-hidden="true" class="w-4 h-4 mr-1 text-gray-200 animate-spin dark:text-gray-600 fill-lightCreateViewSaveButtonText" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        
        <IconFloppyDiskSolid v-else class="w-4 h-4" />
        {{ $t('Save') }}
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.create?.threeDotsDropdownItems as [])"
      ></ThreeDotsMenu>

    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <SingleSkeletLoader v-if="loading"></SingleSkeletLoader>

    
    <ResourceForm 
      v-else
      ref="resourceFormRef"
      :record="record"
      :resource="coreStore.resource!"
      @update:record="onUpdateRecord"
      @update:isValid="isValid = $event"
      :validating="validating"
      :source="'create'"
      :readonlyColumns="readonlyColumns"
    >
    </ResourceForm>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.create?.bottom || []"
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
import ResourceForm from '@/components/ResourceForm.vue';
import SingleSkeletLoader from '@/components/SingleSkeletLoader.vue';
import { useCoreStore } from '@/stores/core';
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions, initThreeDotsDropdown, checkShowIf, compareOldAndNewRecord, generateMessageHtmlForRecordChange } from '@/utils';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';
import { onMounted, onBeforeMount, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { computed } from 'vue';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { type AdminForthComponentDeclarationFull } from '@/types/Common.js';
import type { AdminForthResourceColumn } from '@/types/Back';

const isValid = ref(false);
const validating = ref(false);

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

async function onUpdateRecord(newRecord: any) {
  record.value = newRecord;
}

function checkIfWeCanLeavePage() {
  return wasSaveSuccessful.value || cancelButtonClicked.value || compareOldAndNewRecord(initialValues.value, record.value).ok === false;
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!checkIfWeCanLeavePage()) {
    event.preventDefault();
    event.returnValue = '';
  }
}

window.addEventListener('beforeunload', onBeforeUnload);

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});

onBeforeRouteLeave(async (to, from, next) => {
  if (!checkIfWeCanLeavePage()) {
    const { changedFields } = compareOldAndNewRecord(initialValues.value, record.value);
    
    const messageHtml = generateMessageHtmlForRecordChange(changedFields, t);

    const answer = await confirm({ messageHtml: messageHtml, yes: t('Yes'), no: t('No') });
    if (!answer) return next(false);
  }
  next();
});

onBeforeMount(() => {
  clearSaveInterceptors(route.params.resourceId as string);
});

onMounted(async () => {
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
  if (!isValid.value) {
    validating.value = true;
    await nextTick();
    scrollToInvalidField();
    return;
  } else {
    validating.value = false;
  }
  const requiredColumns = coreStore.resource?.columns.filter(c => c.required?.create === true) || [];
  const requiredColumnsToSkip = requiredColumns.filter(c => checkShowIf(c, record.value, coreStore.resource?.columns || []) === false);  
  saving.value = true;
  const interceptorsResult = await runSaveInterceptors({
    action: 'create',
    values: record.value,
    resource: coreStore.resource,
    resourceId: route.params.resourceId as string,
  });
  if (!interceptorsResult.ok) {
    saving.value = false;
    if (interceptorsResult.error) showErrorTost(interceptorsResult.error);
    return;
  }
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

function scrollToInvalidField() {
  let columnsWithErrors: {column: AdminForthResourceColumn, error: string}[] = [];
  for (const column of resourceFormRef.value?.editableColumns || []) {
    const error = resourceFormRef.value?.columnError(column);
    if (error) {
      columnsWithErrors.push({column, error});
    }
  }
  const errorMessage = t('Failed to save. Please fix errors for the following fields:') + '<ul class="mt-2 list-disc list-inside">' + columnsWithErrors.map(c => `<li><strong>${c.column.label || c.column.name}</strong>: ${c.error}</li>`).join('') + '</ul>';
  alert({
    messageHtml: errorMessage,
    variant: 'danger'
  });
  const firstInvalidElement = document.querySelector('.af-invalid-field-message');
  if (firstInvalidElement) {
    firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

</script>