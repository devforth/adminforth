import { ref } from 'vue'
import { defineStore } from 'pinia'

 type ModalContentType = {
  title: string;
  content: string;
  acceptText: string;
  cancelText: string;
 }


export const useModalStore = defineStore('modal', () => {
  const modalContent = ref({
    title: 'title',
    content: 'content',
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
    modalContent.value = content;
  }
  function resetmodalState() {
    isOpened.value = false;
    modalContent.value = {
      title: 'title',
      content: 'content',
      acceptText: 'acceptText',
      cancelText: 'cancelText',
    };
    setOnAcceptFunction(()=>{});

  }
    
  return {isOpened, setModalContent,onCancelFunction, togleModal,modalContent, setOnAcceptFunction, onAcceptFunction,resetmodalState,setOnCancelFunction} 
   
})
