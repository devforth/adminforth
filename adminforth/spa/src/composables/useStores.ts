import type { FrontendAPIInterface, ConfirmParams, AlertParams } from '../types/FrontendAPI';
import { useToastStore } from '../stores/toast';
import { useModalStore } from '../stores/modal';



declare global {
  interface Window {
    adminforth: {
      confirm: (params: ConfirmParams) => Promise<void>;
      alert: (params: AlertParams) => void;
    };
  }
}

export class FrontendAPI implements FrontendAPIInterface {
  toastStore:any
  modalStore:any
  init() {
    if (window.adminforth) {
      throw new Error('adminforth already initialized');
    }
    this.toastStore = useToastStore();
    this.modalStore = useModalStore();
    console.log(this.toastStore, this.modalStore,'init of adminforth frontend api')
    window.adminforth = {
      confirm: this.confirm.bind(this),
      alert: this.alert.bind(this)
    }
  }

  confirm(params: ConfirmParams): Promise<void> {
    return new Promise((resolve, reject) => {
      this.modalStore.setModalContent({ content: params.message, acceptText: params.yes, cancelText: params.no })
      this.modalStore.onAcceptFunction = resolve
      this.modalStore.onCancelFunction = reject
      this.modalStore.togleModal()
    })
  }

  alert(params: AlertParams): void {
    this.toastStore.addToast({
      message: params.message,
      variant: params.variant
    })
  }
}




