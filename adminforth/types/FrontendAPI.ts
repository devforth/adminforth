import type { AdminForthFilterOperators, FilterParams } from "./Common.js";

export interface FrontendAPIInterface {

    /**
     * Show a confirmation dialog
     * 
     * The dialog will be displayed to the user
     * 
     * Example: 
     * 
     * ```ts
     *import { useAdminforth } from '@/adminforth';
     * 
     * const { confirm } = useAdminforth();
     * const isConfirmed = await confirm({message: 'Are you sure?', yes: 'Yes', no: 'No'})
     * if (isConfirmed) {
     *  your code...
     * }
     * ```
     * 
     * @param params - The parameters of the dialog
     * @returns A promise that resolves when the user confirms the dialog
     */   
    confirm(params: ConfirmParams): Promise<boolean>;
    
    /**
     * Show an alert
     * 
     * The alert will be displayed to the user
     * 
     * Example:
     * 
     * ```ts
     * import { useAdminforth } from '@/adminforth';
     * const { alert } = useAdminforth();
     * 
     * alert({message: 'Hello', variant: 'success'})
     * ```
     * 
     * @param params - The parameters of the alert
     */
    alert(params:AlertParams): void | Promise<string> | string;


    list: {

        /**
         * Full refresh the list. Loader will be shown during fetching data. Will fully reload table data from the server. If new data available, it will be shown in the list.
         */
        refresh(): Promise<{ error? : string }>;

        /**
         * Silently Refresh existing rows in the list (without loader). 
         * Should be called when table data already loaded, otherwise method will return an error.
         * If new data available, it will not appear in the list.
         */
        silentRefresh(): Promise<{ error? : string }>;

        /**
         * Refresh a specific row in the list without loader, row should be already shown in the list, otherwise method will return an error
         */
        silentRefreshRow (pk: any): Promise<{ error? : string }>;

        /**
         * Close the three dots dropdown
         */
        closeThreeDotsDropdown(): void;

        /**
         * Set a filter in the list.
         * Works only when user located on the list page. If filter already exists, it will be replaced with the new one.
         * Can be used to set filter from charts or other components in pageInjections.
         * 
         * Filters are automatically marked as hidden (won't count in badge) if:
         * - Column has showIn.filter: false
         * 
         * Example:
         * 
         * ```ts
         * import { useAdminforth } from '@/adminforth';
         * 
         * const { list } = useAdminforth();
         * // Regular filter (will show in badge if column.showIn.filter !== false)
         * list.setFilter({field: 'name', operator: 'ilike', value: 'john'})
         * 
         * // Hidden filter (won't show in badge if column.showIn.filter === false)
         * list.setFilter({field: 'internal_status', operator: 'eq', value: 'active'})
         * ```
         * 
         * Please note that you can set/update filter even for fields which have showIn.filter=false in resource configuration.
         * Also you can set filter for virtual columns. For example Universal search plugin calls updateFilter for virtual column which has showIn.filter=false (because we dont want to show this column in filter dropdown, plugin renders its own filter UI)
         * 
         * @param filter - The filter to set
         */
        setFilter(filter: FilterParams): void;

        /**
         * @deprecated does the same as setFilter, kept for backward compatibility, will be removed in 2.0.0
         * 
         * Update a filter in the list
         * 
         * Filters visibility in badge is automatically determined by column configuration:
         * - Hidden if column has showIn.filter: false
         * 
         * Example:
         * 
         * ```ts
         * import { useAdminforth } from '@/adminforth';
         * const { list } = useAdminforth();
         * list.updateFilter({field: 'name', operator: 'ilike', value: 'john'})
         * ```
         * 
         * @param filter - The filter to update
         */
        updateFilter(filter: FilterParams): void;

        /**
         * Clear all filters from the list
         */
        clearFilters(): void;
    }

    show: {
        /**
         * Full refresh the current record on the show page. Loader may be shown during fetching.
         * Fire-and-forget; you don't need to await it.
         */
        refresh(): void;
    }

    menu: {
        /**
         * Refreshes the badges in the menu, by recalling the badge function for each menu item
         */
        refreshMenuBadges(): void;
    }

    /**
     * Close the user menu dropdown
     */
    closeUserMenuDropdown(): void;

    /**
     * Run save interceptors for a specific resource or all resources if no resourceId is provided
     */
    runSaveInterceptors(params: { action: 'create'|'edit'; values: any; resource: any; resourceId: string; }): Promise<{ ok: boolean; error?: string | null; extra?: object; }>;

    /**
     * Clear save interceptors for a specific resource or all resources if no resourceId is provided
     * 
     * @param resourceId - The resource ID to clear interceptors for
     */
    clearSaveInterceptors(resourceId?: string): void;
}

export type ConfirmParams = {
    /**
     * The message to display in the dialog
     */
    message?: string;
    /**
     * Message to display in the dialog as HTML (can be used instead of message)
     */
    messageHtml?: string;
    /**
     * The text to display in the "accept" button
     */
    yes?: string;
    /**
     * The text to display in the "cancel" button
     */
    no?: string;
   
}

export type AlertParams = {
    /**
     * The message to display in the alert
     */
    message?: string;

    /**
     * The message to display in the alert as HTML (can be used instead of message)
     */
    messageHtml?: string;
    
    /**
     * The variant of the alert
     */
    variant?: AlertVariant | keyof typeof AlertVariant;

    /**
     * The timeout of the alert in seconds or 'unlimited' to keep the alert open until the user closes it.
     * Default is 10 seconds;
     */
    timeout?: number | 'unlimited';

    /**
     * Optional buttons to display in the alert
     */
    buttons?: {value: any, label: string}[];

}



export enum AlertVariant {
    danger = 'danger',
    success = 'success',
    warning = 'warning',
    info = 'info'
  }

  
  


