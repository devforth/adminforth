 
export interface FrontendAPIInterface {

    /**
     * Show a confirmation dialog
     * 
     * The dialog will be displayed to the user
     * 
     * Example: 
     * 
     * ```ts
     * const isConfirmed = await window.adminforth.confirm({message: 'Are you sure?', yes: 'Yes', no: 'No'})
     * if (isConfirmed) {
     *  your code...
     * }
     * ```
     * 
     * @param params - The parameters of the dialog
     * @returns A promise that resolves when the user confirms the dialog
     */   
    confirm(params:ConfirmParams ): Promise<void>;
    /**
     * Show an alert
     * 
     * The alert will be displayed to the user
     * 
     * Example:
     * 
     * ```ts
     *  window.adminforth.alert({message: 'Hello', variant: 'success'})
     * ```
     * 
     * @param params - The parameters of the alert
     */
    alert(params:AlertParams): void;
    /**
     * Add a filter to the list of filters.
     * Works only when user located on the list page.
     * Can be used to set filter from charts or other components in pageInjections.
     * 
     * Example:
     * 
     * ```ts
     * window.adminforth.updateListFilter({field: 'name', operator: 'ilike', value: 'john'})
     * ```
     * 
     * @param filter - The filter to add
     */
    setListFilter(filter: any): void;
    /**
     * Update a filter in the list of filters
     * 
     * Example:
     * 
     * ```ts
     * window.adminforth.updateListFilter({field: 'name', operator: 'ilike', value: 'john'})
     * ```
     * 
     * @param filter - The filter to update
     */
    updateListFilter(filter: any): void;
    /**
     * Clear all filters from the list
     */
    clearListFilters(): void;

}

export type ConfirmParams = {
    /**
     * The message to display in the dialog
     */
    message?: string;
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
    
}



export enum AlertVariant {
    danger = 'danger',
    success = 'success',
    warning = 'warning',
    info = 'info'
  }

  
  


