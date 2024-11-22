import type { FrontendAPIInterface, ConfirmParams, AlertParams, } from '@/types/FrontendAPI';
import type { AdminForthFilterOperators, AdminForthResourceColumn } from '@/types/Common';
import { useToastStore } from '../stores/toast';
import { useModalStore } from '../stores/modal';
import { useCoreStore } from '@/stores/core';
import { useFiltersStore } from '@/stores/filters';
import router from '@/router'

type FilterParams = {
  /**
   * Field of resource to filter
   */
  field: string;
  /**
   * Operator of filter
   */
  operator: AdminForthFilterOperators;
  /**
   * Value of filter
   */
  value: string | number | boolean ;
}

declare global {
  interface Window {
    adminforth: FrontendAPIInterface;
  }
}

export class FrontendAPI {
  private toastStore:any
  private modalStore:any
  private filtersStore:any  
  private coreStore:any
  init() {
    if (window.adminforth) {
      throw new Error('adminforth already initialized');
    }
    this.toastStore = useToastStore();
    this.modalStore = useModalStore();
    
    window.adminforth = {
      confirm: this.confirm.bind(this),
      alert: this.alert.bind(this),

      list: {
        refresh: () => {/* will be redefined in list*/},
        closeThreeDotsDropdown: () => {/* will be redefined in list*/},
        closeUserMenuDropdown: () => {/* will be redefined in list*/},
        setFilter: () => this.setListFilter.bind(this),
        updateFilter: () => this.updateListFilter.bind(this),
        clearFilters: () => this.clearListFilters.bind(this),
      },
      menu: {
        refreshMenuBadges: () => {/* will be redefined */}
      },
    };
  }

  confirm(params: ConfirmParams): Promise<void> {
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

  alert(params: AlertParams): void {
    this.toastStore.addToast({
      message: params.message,
      messageHtml: params.messageHtml,
      variant: params.variant,
      timeout: params.timeout  
    })
  }

  listFilterValidation(filter: FilterParams): boolean {
    if(router.currentRoute.value.meta.type !== 'list'){
      throw new Error(`Cannot use ${this.setListFilter.name} filter on a list page`)
    } else {
      if(!this.coreStore) this.coreStore = useCoreStore()
      console.log(this.coreStore.resourceColumnsWithFilters,'core store')
      const filterField = this.coreStore.resourceColumnsWithFilters.find((col: AdminForthResourceColumn) => col.name === filter.field)
      if(!filterField){
          throw new Error(`Field ${filter.field} is not available for filtering`)
      }
      
    }
    return true
  }

  setListFilter(filter: FilterParams): void {
    if(this.listFilterValidation(filter)){
      this.filtersStore = useFiltersStore()
      if(this.filtersStore.filters.some((f) => {return f.field === filter.field && f.operator === filter.operator})){
        throw new Error(`Filter ${filter.field} with operator ${filter.operator} already exists`)
      } else {
      this.filtersStore.setFilter(filter)
      }
    }
  }

  clearListFilters(): void {
    this.filtersStore = useFiltersStore()
    this.filtersStore.clearFilters()
  }

  updateListFilter(filter: FilterParams): void {
    if(this.listFilterValidation(filter)){
      this.filtersStore = useFiltersStore()
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
