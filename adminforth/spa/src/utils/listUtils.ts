import { nextTick, onMounted, ref, resolveComponent } from 'vue';
import { callAdminForthApi } from '@/utils';
import { type AdminForthResourceCommon } from '../types/Common';
import { useAdminforth } from '@/adminforth';
import { showErrorTost } from '@/composables/useFrontendApi'


export async function getList(resource: AdminForthResourceCommon, isPageLoaded: boolean, page: number | null , pageSize: number, sort: any, checkboxes:{ value: any[] }, filters: any = [] ) {
  let rows: any[] = [];
  let totalRows: number | null = null;
  if (!isPageLoaded) {
    return; 
  }
  const data = await callAdminForthApi({
    path: '/get_resource_data',
    method: 'POST',
    body: {
      source: 'list',
      resourceId: resource.resourceId,
      limit: pageSize,
      offset: ((page || 1) - 1) * pageSize,
      filters: filters,
      sort: sort,
    }
  });
  if (data.error) {
    showErrorTost(data.error);
    rows = [];
    totalRows = 0;
    return {rows, totalRows, error: data.error};
  }
  rows = data.data?.map((row: any) => {
    if (resource?.columns?.find(c => c.primaryKey)?.foreignResource) {
      row._primaryKeyValue = row[resource.columns.find(c => c.primaryKey)!.name].pk;
    } else if (resource) {
      row._primaryKeyValue = row[resource.columns.find(c => c.primaryKey)!.name];
    }
    return row;
  });
  totalRows = data.total;
  
  // if checkboxes have items which are not in current data, remove them
  checkboxes.value = checkboxes.value.filter((pk: any) => rows.some((r: any) => r._primaryKeyValue === pk));
  await nextTick();
  return { rows, totalRows };
}



export async function startBulkAction(actionId: string, resource: AdminForthResourceCommon, checkboxes: { value: any[] }, 
  bulkActionLoadingStates: {value: Record<string, boolean>}, getListInner: () => Promise<any>) {
  const action = resource?.options?.bulkActions?.find(a => a.id === actionId);
  const { confirm, alert } = useAdminforth();

  if (action?.confirm) {
    const confirmed = await confirm({
      message: action.confirm,
    });
    if (!confirmed) {
      return;
    }
  }
  bulkActionLoadingStates.value[actionId] = true;

  const data = await callAdminForthApi({
    path: '/start_bulk_action',
    method: 'POST',
    body: {
      resourceId: resource.resourceId,
      actionId: actionId,
      recordIds: checkboxes.value
    }
  });
  bulkActionLoadingStates.value[actionId] = false;
  if (data?.ok) {
    checkboxes.value = [];
    await getListInner();

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