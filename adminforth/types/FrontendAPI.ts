 
export interface FrontendAPIInterface {

    /**
     * Show a confirmation dialog
     * 
     * The dialog will be displayed to the user
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
     * ```ts
     * Example: window.adminforth.alert({message: 'Hello', variant: 'success'})
     * ```
     * 
     * @param params - The parameters of the alert
     */
    alert(params:AlertParams): void;
}

type ConfirmParams = {
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

type AlertParams = {
    /**
     * The message to display in the alert
     */
    message?: string;
    /**
     * The variant of the alert
     */
    variant?: AlertVariant;
}

enum AlertVariant {
    Danger = 'danger',
    Success = 'success',
    Warning = 'warning',
    Info = 'info'
  }
  


