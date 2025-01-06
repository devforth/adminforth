// dropdownStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDropdownStore = defineStore('dropdown', () => {
  const openSelectID = ref<string | null>(null);

  function setOpenSelectID(id: string) {
    openSelectID.value = id;
  }

  return {
    openSelectID,
    setOpenSelectID,
  };
});
