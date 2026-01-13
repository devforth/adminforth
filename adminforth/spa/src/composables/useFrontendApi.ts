import { useAdminforth } from '@/adminforth';


export function showSuccesTost(message: string) {
  const { alert } = useAdminforth();
  alert({ message, variant: 'success' });  
  return message;
}

export function showWarningTost(message: string) {
  const { alert } = useAdminforth();
  alert({ message, variant: 'warning' });  
  return message;
}

export function showErrorTost(message: string, timeout?: number) {
  const { alert } = useAdminforth();
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