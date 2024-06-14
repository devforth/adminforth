 
export interface FrontendAPIInterface {
    /**
     * Initialize the frontend API
     * 
     */
    init(): void;
    /**
     * Show a confirmation dialog
     * 
     * @param params - The parameters of the dialog
     * @returns A promise that resolves when the user confirms the dialog
     */   
    confirm(params:ConfirmParams ): Promise<void>;
    /**
     * Show an alert
     * 
     * @param params - The parameters of the alert
     */
    alert(params:AlertParams): void;
}

type ConfirmParams = {
    message?: string;
    yes?: string;
    no?: string;
   
}

type AlertParams = {
    message: string;
    variant: 'danger' | 'success' | 'warning' | 'info';
}


