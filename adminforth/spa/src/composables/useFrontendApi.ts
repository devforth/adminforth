import { useAdminforth } from '@/adminforth';

const { alert } = useAdminforth();

export function showSuccesTost(message: string) {
  alert({ message, variant: 'success' });  
  return message;
}

export function showWarningTost(message: string) {
  alert({ message, variant: 'warning' });  
  return message;
}

export function showErrorTost(message: string, timeout?: number) {
  alert({ message, variant: 'danger', timeout: timeout || 30});  
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