<template>
  <div class="relative w-full">
    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.beforeBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <BreadcrumbsWithButtons>
      <!-- save and cancle -->
      <button @click="() => {cancelButtonClicked = true; $router.back()}"
        class="flex items-center py-1 px-3 me-2 text-sm font-medium text-lightEditViewButtonText  rounded-default focus:outline-none bg-lightEditViewButtonBackground rounded border border-lightEditViewButtonBorder hover:bg-lightEditViewButtonBackgroundHover hover:text-lightEditViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightEditViewButtonFocusRing dark:focus:ring-darkEditViewButtonFocusRing dark:bg-darkEditViewButtonBackground dark:text-darkEditViewButtonText dark:border-darkEditViewButtonBorder dark:hover:text-darkEditViewButtonTextHover dark:hover:bg-darkEditViewButtonBackgroundHover"
      >
        {{ $t('Cancel') }}
      </button>
      <button
        @click="() => saveRecord()"
        class="flex items-center py-1 px-3 text-sm font-medium  rounded-default text-lightEditViewSaveButtonText focus:outline-none bg-lightEditViewButtonBackground rounded border border-lightEditViewButtonBorder hover:bg-lightEditViewButtonBackgroundHover hover:text-lightEditViewSaveButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightEditViewButtonFocusRing dark:focus:ring-darkEditViewButtonFocusRing dark:bg-darkEditViewButtonBackground dark:text-darkEditViewSaveButtonText dark:border-darkEditViewButtonBorder dark:hover:text-darkEditViewSaveButtonTextHover dark:hover:bg-darkEditViewButtonBackgroundHover disabled:opacity-50 gap-1"
        :disabled="saving || (validating && !isValid)"
      >
        <IconFloppyDiskSolid class="w-4 h-4" />
        {{ $t('Save') }}
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="(coreStore.resourceOptions?.pageInjections?.edit?.threeDotsDropdownItems as [])"
      ></ThreeDotsMenu>

    </BreadcrumbsWithButtons>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.afterBreadcrumbs || []"
      :is="getCustomComponent(c)"
      :meta="(c as AdminForthComponentDeclarationFull).meta"
      :record="coreStore.record"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
    />

    <SingleSkeletLoader v-if="loading"></SingleSkeletLoader>
 
    <ResourceForm 
      v-else-if="coreStore.resource"
      ref="resourceFormRef"
      :record="editableRecord"
      :resource="coreStore.resource"
      :adminUser="coreStore.adminUser"
      @update:record="onUpdateRecord"
      @update:isValid="isValid = $event"
      :validating="validating"
      :source="'edit'"
    >
    </ResourceForm>

    <component 
      v-for="c in coreStore?.resourceOptions?.pageInjections?.edit?.bottom || []"
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
import { callAdminForthApi, getCustomComponent,checkAcessByAllowedActions, initThreeDotsDropdown } from '@/utils';
import { IconFloppyDiskSolid } from '@iconify-prerendered/vue-flowbite';
import { computed, onMounted, onBeforeMount, ref, type Ref, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import { useAdminforth } from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { type AdminForthComponentDeclarationFull } from '@/types/Common.js';
import type { AdminForthResourceColumn } from '@/types/Back';

const { t } = useI18n();
const coreStore = useCoreStore();
const { clearSaveInterceptors, runSaveInterceptors, alert, confirm } = useAdminforth();

const isValid = ref(false);
const validating = ref(false);

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const saving = ref(false);

const record: Ref<Record<string, any>> = ref({});

const initialRecord = computed(() => coreStore.record);
const wasSaveSuccessful = ref(false);
const cancelButtonClicked = ref(false);

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!checkIfWeCanLeavePage()) {
    event.preventDefault();
    event.returnValue = '';
  }
}

function checkIfWeCanLeavePage() {
  return wasSaveSuccessful.value || cancelButtonClicked.value || JSON.stringify(record.value) === JSON.stringify(initialRecord.value);
}

window.addEventListener('beforeunload', onBeforeUnload);

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload);
});

onBeforeRouteLeave(async (to, from, next) => {
  if (!checkIfWeCanLeavePage()) {
      const answer = await confirm({message: t('There are unsaved changes. Are you sure you want to leave this page?'), yes: 'Yes', no: 'No'});
      if (!answer) return next(false);
  }
  next();
});

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
        newRecord[column.name] = newRecord[column.name]?.map((fr: { pk: any }) => fr.pk);
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
  if (!isValid.value) {
    validating.value = true;
    await nextTick();
    scrollToInvalidField();
    return;
  } else {
    validating.value = false;
  }

  saving.value = true;
  const interceptorsResult = await runSaveInterceptors({
    action: 'edit',
    values: record.value,
    resource: coreStore.resource,
    resourceId: route.params.resourceId as string,
  });
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
      timeout: 400000
    });
    router.push({ name: 'resource-show', params: { resourceId: route.params.resourceId, primaryKey: resp.recordId } });
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