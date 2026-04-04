import type { AdminForthResourceColumn } from '@/types/Back';
import { useAdminforth } from '@/adminforth';
import { type Ref, nextTick } from 'vue';

export function scrollToInvalidField(resourceFormRef: any, t: (key: string) => string) {
  const { alert } = useAdminforth();
  let columnsWithErrors: {column: AdminForthResourceColumn, error: string}[] = [];
  for (const column of resourceFormRef.value?.editableColumns || []) {
    if (resourceFormRef.value?.columnsWithErrors[column.name]) {
      columnsWithErrors.push({
        column,
        error: resourceFormRef.value?.columnsWithErrors[column.name]
      });
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

export async function saveRecordPreparations(
  viewMode: 'create' | 'edit',
  validatingMode: Ref<boolean>, 
  resourceFormRef: Ref<any>, 
  isValid: Ref<boolean>, 
  t: (key: string) => string, 
  saving: Ref<boolean>, 
  runSaveInterceptors: any, 
  record: Ref<Record<string, any>>, 
  coreStore: any, 
  route: any
) {
  validatingMode.value = true;
  await nextTick();
  //wait for response for the user validation function if it exists
  while (1) {
    if (resourceFormRef.value?.isValidating) {
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      break;
    }
  }
  if (!isValid.value) {
    await nextTick();
    scrollToInvalidField(resourceFormRef, t);
    return;
  } else {
    validatingMode.value = false;
  }

  saving.value = true;
  const interceptorsResult = await runSaveInterceptors({
    action: viewMode,
    values: record.value,
    resource: coreStore.resource,
    resourceId: route.params.resourceId as string,
  });
  return interceptorsResult;
}