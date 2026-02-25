import type { FrontendAPIInterface, ConfirmParams, AlertParams, } from '@/types/FrontendAPI';
import type { AdminForthFilterOperators, AdminForthResourceColumnCommon, FilterParams } from '@/types/Common';
import { useToastStore } from '@/stores/toast';
import { useModalStore } from '@/stores/modal';
import { useCoreStore } from '@/stores/core';
import { useFiltersStore } from '@/stores/filters';
import router from '@/router'



declare global {
  interface Window {
    adminforth: FrontendAPIInterface;
  }
}

class FrontendAPI implements FrontendAPIInterface {
  public toastStore:any
  public modalStore:any
  public filtersStore:any  
  public coreStore:any
  private saveInterceptors: Record<string, Array<(ctx: { action: 'create'|'edit'; values: any; resource: any; resourceId: string; }) => Promise<{ ok: boolean; error?: string | null; extra?: object; }>>> = {};

  public list: {
    refresh(): Promise<{ error? : string }>;
    silentRefresh(): Promise<{ error? : string }>;
    silentRefreshRow(pk: any): Promise<{ error? : string }>;
    closeThreeDotsDropdown(): Promise<{ error? : string }>;
    closeUserMenuDropdown: () => void;
    setFilter: (filter: FilterParams) => void;
    updateFilter: (filter: FilterParams) => void;
    clearFilters: () => void;
  }

  public menu: {
    refreshMenuBadges: () => void;
  }

  public show: {
    refresh(): void;
  }

  closeUserMenuDropdown(): void {
    console.log('closeUserMenuDropdown')
  }


  constructor() {

    this.menu = {
      refreshMenuBadges: () => {
        console.log('refreshMenuBadges')
      }
    }

    this.list = {
      refresh: async () => {
        console.log('refresh');
        return { error: 'Not implemented' }
      },
      silentRefresh: async () => {
        console.log('silentRefresh')
        return { error: 'Not implemented' }
      },
      silentRefreshRow: async () => {
        console.log('silentRefreshRow')
        return { error: 'Not implemented' }
      },
      closeThreeDotsDropdown: async () => {
        console.log('closeThreeDotsDropdown')
        return { error: 'Not implemented' }
      },
      closeUserMenuDropdown: () => {
        console.log('closeUserMenuDropdown')
      },
      setFilter: this.setListFilter.bind(this),
      updateFilter: this.updateListFilter.bind(this),
      clearFilters: this.clearListFilters.bind(this),
    }

    this.show = {
      refresh: () => {
        console.log('show.refresh')
      }
    }
  }

  registerSaveInterceptor(
    handler: (ctx: { action: 'create'|'edit'; values: any; resource: any; }) => Promise<{ ok: boolean; error?: string | null; extra?: object; }>,
  ): void {
    const rid = router.currentRoute.value?.params?.resourceId as string;
    if (!rid) {
      return;
    }
    if (!this.saveInterceptors[rid]) {
      this.saveInterceptors[rid] = [];
    }
    this.saveInterceptors[rid].push(handler);
  }

  async runSaveInterceptors(params: { action: 'create'|'edit'; values: any; resource: any; resourceId: string; }): Promise<{ ok: boolean; error?: string | null; extra?: object; }> {
    const list = this.saveInterceptors[params.resourceId] || [];
    const aggregatedExtra: Record<string, any> = {};
    for (const fn of list) {
      try {
        const res = await fn(params);
        if (typeof res !== 'object' || typeof res.ok !== 'boolean') {
          return { ok: false, error: 'Invalid interceptor return value' };
        }
        if (!res.ok) { 
          return { ok: false, error: res.error ?? 'Interceptor failed' };
        }
        if (res.extra) {
          Object.assign(aggregatedExtra, res.extra);
        }
      } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
      }
    }
    return { ok: true, extra: aggregatedExtra };
  }

  clearSaveInterceptors(resourceId?: string): void {
    if (resourceId) {
      delete this.saveInterceptors[resourceId];
    } else {
      this.saveInterceptors = {};
    }
  }

  confirm(params: ConfirmParams): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.modalStore.setModalContent({ 
        content: params.message, 
        contentHTML: params.messageHtml,
        acceptText: params.yes || 'Yes',
        cancelText: params.no || 'Cancel' 
      })
      this.modalStore.onAcceptFunction = resolve
      this.modalStore.onCancelFunction = reject
      this.modalStore.togleModal()
    })
  }

  alert(params: AlertParams): void | Promise<string> | string {
    const toats = {
      message: params.message,
      messageHtml: params.messageHtml,
      variant: params.variant,
      timeout: params.timeout,
      buttons: params.buttons,  
    }
    if (params.buttons && params.buttons.length > 0) {
      return new Promise<string>((resolve) => {
        this.toastStore.addToast({
          ...toats,
          onResolve: (value?: any) => resolve(String(value ?? '')),
        })
      })
    } else {
      this.toastStore.addToast({...toats})
    }
  }

  listFilterValidation(filter: FilterParams): boolean {
    if(router.currentRoute.value.meta.type !== 'list'){
      throw new Error(`Cannot use ${this.setListFilter.name} filter on a list page`)
    }
    return true
  }

  setListFilter(filter: FilterParams): void {
    if(this.listFilterValidation(filter)){
      const existingFilterIndex = this.filtersStore.filters.findIndex((f: any) => {
        return f.field === filter.field && f.operator === filter.operator
      });
      
      if(existingFilterIndex !== -1){
        // Update existing filter instead of throwing error
        const filters = [...this.filtersStore.filters];
        if (filter.value === undefined) {
          filters.splice(existingFilterIndex, 1);
        } else {
          filters[existingFilterIndex] = filter;
        }
        this.filtersStore.setFilters(filters);
      } else {
        this.filtersStore.setFilter(filter);
      }
    }
  }

  clearListFilters(): void {
    this.filtersStore.clearFilters()
  }

  updateListFilter(filter: FilterParams): void {
    if(this.listFilterValidation(filter)){
      const index = this.filtersStore.filters.findIndex((f: FilterParams) => f.field === filter.field)
      if(index === -1) {
        this.filtersStore.setFilter(filter)
      } else {
        const filters = [...this.filtersStore.filters];
        if (filter.value === undefined) {
          filters.splice(index, 1);
        } else {
          filters[index] = filter;
        }
        this.filtersStore.setFilters(filters);
      }
    }
  }

}

const frontendAPI: FrontendAPIInterface = new FrontendAPI();
window.adminforth = frontendAPI;

export function initFrontedAPI() {
  // force init
  const api: FrontendAPI = frontendAPI as FrontendAPI;
  api.toastStore = useToastStore();
  api.modalStore = useModalStore();
  api.coreStore = useCoreStore();
  api.filtersStore = useFiltersStore();
}

export function useAdminforth() {
  const api = frontendAPI as FrontendAPI;
  return {
    registerSaveInterceptor: (handler: (ctx: { action: 'create'|'edit'; values: any; resource: any; }) => Promise<{ ok: boolean; error?: string | null; extra?: object; }>) => api.registerSaveInterceptor(handler),
    alert: (params: AlertParams) => api.alert(params),
    confirm: (params: ConfirmParams) => api.confirm(params),
    list: api.list,
    show: api.show,
    menu: api.menu,
    closeUserMenuDropdown: () => api.closeUserMenuDropdown(),
    runSaveInterceptors: (params: { action: 'create'|'edit'; values: any; resource: any; resourceId: string; }) => api.runSaveInterceptors(params),
    clearSaveInterceptors: (resourceId?: string) => api.clearSaveInterceptors(resourceId),
  };
}


export default frontendAPI;