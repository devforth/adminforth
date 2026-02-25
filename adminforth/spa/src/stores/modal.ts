import { ref } from 'vue'
import { defineStore } from 'pinia'

 type ModalContentType = {
  title?: string;
  content?: string;
  contentHTML?: string;
  acceptText?: string;
  cancelText?: string;
 }


export const useModalStore = defineStore('modal', () => {
  const modalContent = ref({
    title: 'title',
    content: '',
    contentHTML: '',
    acceptText: 'acceptText',
    cancelText: 'cancelText',
  });  
  const isOpened = ref(false);
  const onAcceptFunction: any = ref(()=>{});
  const onCancelFunction: any = ref(()=>{});
  function togleModal() {
    isOpened.value = !isOpened.value;
  }
  function setOnAcceptFunction(func: Function) {
    onAcceptFunction.value = func;
  }
  function setOnCancelFunction(func: Function) {
    onCancelFunction.value = func;
  }
  function setModalContent(content: ModalContentType) {
    modalContent.value = {
      title: content.title || 'title',
      content: content.content || '',
      contentHTML: content.contentHTML || '',
      acceptText: content.acceptText || 'acceptText',
      cancelText: content.cancelText || 'cancelText',
    };
  }
  function resetmodalState() {
    isOpened.value = false;
    modalContent.value = {
      title: 'title',
      content: 'content',
      contentHTML: '',
      acceptText: 'acceptText',
      cancelText: 'cancelText',
    };
    setOnAcceptFunction(()=>{});

  }
    
  return {isOpened, setModalContent,onCancelFunction, togleModal,modalContent, setOnAcceptFunction, onAcceptFunction,resetmodalState,setOnCancelFunction} 
   
})
