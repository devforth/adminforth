export function showSuccesTost(message: string) {
  window.adminforth.alert({ message, variant: 'success' });  
  return message;
}

export function showWarningTost(message: string) {
  window.adminforth.alert({ message, variant: 'warning' });  
  return message;
}

export function showErrorTost(message: string, timeout?: number) {
  window.adminforth.alert({ message, variant: 'danger', timeout: timeout || 'unlimited'});  
  return message;
}


const useFrontendApi = () => {
    return {
        showSuccesTost,
        showWarningTost,
        showErrorTost
    }
}


export default useFrontendApi;