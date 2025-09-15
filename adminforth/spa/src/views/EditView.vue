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
      <button @click="$router.back()"
        class="flex items-center py-1 px-3 me-2 text-sm font-medium text-lightEditViewButtonText  rounded-default focus:outline-none bg-lightEditViewButtonBackground rounded border border-lightEditViewButtonBorder hover:bg-lightEditViewButtonBackgroundHover hover:text-lightEditViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightEditViewButtonFocusRing dark:focus:ring-darkEditViewButtonFocusRing dark:bg-darkEditViewButtonBackground dark:text-darkEditViewButtonText dark:border-darkEditViewButtonBorder dark:hover:text-darkEditViewButtonTextHover dark:hover:bg-darkEditViewButtonBackgroundHover"
      >
        {{ $t('Cancel') }}
      </button>

      <button
        @click="saveRecord"
        class="flex items-center py-1 px-3 text-sm font-medium  rounded-default text-lightEditViewSaveButtonText focus:outline-none bg-lightEditViewButtonBackground rounded border border-lightEditViewButtonBorder hover:bg-lightEditViewButtonBackgroundHover hover:text-lightEditViewSaveButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightEditViewButtonFocusRing dark:focus:ring-darkEditViewButtonFocusRing dark:bg-darkEditViewButtonBackground dark:text-darkEditViewSaveButtonText dark:border-darkEditViewButtonBorder dark:hover:text-darkEditViewSaveButtonTextHover dark:hover:bg-darkEditViewButtonBackgroundHover disabled:opacity-50 gap-1"
        :disabled="saving || (validating && !isValid)"
      >
        <IconFloppyDiskSolid class="w-4 h-4" />
        {{ $t('Save') }}
      </button>

      <ThreeDotsMenu 
        :threeDotsDropdownItems="Array.isArray(coreStore.resourceOptions?.pageInjections?.edit?.threeDotsDropdownItems)
          ? coreStore.resourceOptions.pageInjections.edit.threeDotsDropdownItems
          : coreStore.resourceOptions?.pageInjections?.edit?.threeDotsDropdownItems
            ? [coreStore.resourceOptions.pageInjections.edit.threeDotsDropdownItems]
            : undefined"
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
import { computed, onMounted, ref, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import ThreeDotsMenu from '@/components/ThreeDotsMenu.vue';
import adminforth from '@/adminforth';
import { useI18n } from 'vue-i18n';
import { type AdminForthComponentDeclarationFull } from '@/types/Common.js';

const { t } = useI18n();
const coreStore = useCoreStore();

const isValid = ref(false);
const validating = ref(false);

const route = useRoute();
const router = useRouter();

const loading = ref(true);

const saving = ref(false);

const record: Ref<Record<string, any>> = ref({});

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
    return;
  } else {
    validating.value = false;
  }

  saving.value = true;
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

  const resp = await callAdminForthApi({
    method: 'POST',
    path: `/update_record`,
    body: {
      resourceId: route.params.resourceId,
      recordId: route.params.primaryKey,
      record: updates,
    },
  });
  if (resp.error && resp.error !== 'Operation aborted by hook') {
    showErrorTost(resp.error);
  } else {
    adminforth.alert({
      message: t('Record updated successfully'),
      variant: 'success',
      timeout: 400000
    });
  }
  saving.value = false;
  router.push({ name: 'resource-show', params: { resourceId: route.params.resourceId, primaryKey: resp.recordId } });
}

</script>