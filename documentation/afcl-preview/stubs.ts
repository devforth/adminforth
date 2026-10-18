import { reactive } from 'vue';

// stand-ins for the core store and the frontend API of the app, the only app modules AFCL components use

export const coreStore = reactive({
  theme: 'light',
  isIos: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document),
});

export function useCoreStore() {
  return coreStore;
}

export function useAdminforth() {
  return { alert: ({ message }: { message: string }) => window.alert(message) };
}
