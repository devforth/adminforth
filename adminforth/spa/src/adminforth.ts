import type { FilterParams, FrontendAPIInterface, ConfirmParams, AlertParams, } from '@/types/FrontendAPI';
import type { AdminForthFilterOperators, AdminForthResourceColumnCommon } from '@/types/Common';
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

  public list: {
    refresh(): Promise<{ error? : string }>;
    silentRefresh(): Promise<{ error? : string }>;
    silentRefreshRow(): Promise<{ error? : string }>;
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

  confirm(params: ConfirmParams): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.modalStore.setModalContent({ 
        content: params.message, 
        acceptText: params.yes || 'Yes',
        cancelText: params.no || 'Cancel' 
      })
      this.modalStore.onAcceptFunction = resolve
      this.modalStore.onCancelFunction = reject
      this.modalStore.togleModal()
    })
  }

  alert(params: AlertParams): void | Promise<string> | string {
    if (params.buttons && params.buttons.length > 0) {
      return new Promise<string>((resolve) => {
        // store a resolver with the toast so the Toast component can resolve it
        this.toastStore.addToast({
          message: params.message,
          messageHtml: params.messageHtml,
          variant: params.variant,
          timeout: params.timeout,
          buttons: params.buttons,
          onResolve: (value?: any) => resolve(String(value ?? '')),
        })
      })
    } else {
      this.toastStore.addToast({
        message: params.message,
        messageHtml: params.messageHtml,
        variant: params.variant,
        timeout: params.timeout,
        buttons: params.buttons,  
      })
    }
  }

  listFilterValidation(filter: FilterParams): boolean {
    if(router.currentRoute.value.meta.type !== 'list'){
      throw new Error(`Cannot use ${this.setListFilter.name} filter on a list page`)
    } else {
      console.log(this.coreStore.resourceColumnsWithFilters,'core store')
      const filterField = this.coreStore.resourceColumnsWithFilters.find((col: AdminForthResourceColumnCommon) => col.name === filter.field)
      if(!filterField){
          throw new Error(`Field ${filter.field} is not available for filtering`)
      }
      
    }
    return true
  }

  setListFilter(filter: FilterParams): void {
    if(this.listFilterValidation(filter)){
      if(this.filtersStore.filters.some((f: any) => {return f.field === filter.field && f.operator === filter.operator})){
        throw new Error(`Filter ${filter.field} with operator ${filter.operator} already exists`)
      } else {
      this.filtersStore.setFilter(filter)
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


export default frontendAPI;