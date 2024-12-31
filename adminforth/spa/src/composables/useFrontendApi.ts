import adminforth from '@/adminforth';

export function showSuccesTost(message: string) {
  adminforth.alert({ message, variant: 'success' });  
  return message;
}

export function showWarningTost(message: string) {
  adminforth.alert({ message, variant: 'warning' });  
  return message;
}

export function showErrorTost(message: string, timeout?: number) {
  adminforth.alert({ message, variant: 'danger', timeout: timeout || 30});  
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