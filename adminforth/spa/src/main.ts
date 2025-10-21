import { createApp } from 'vue'
import { createPinia } from 'pinia'
/* IMPORTANT:ADMINFORTH IMPORTS */


import App from './App.vue'
import router from './router'
import { initI18n } from './i18n'
declare global {
  interface Window {
	i18n: any;
  }
}

export const app: ReturnType<typeof createApp> = createApp(App)
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */

app.use(createPinia())
app.use(router)

// get access to i18n instance outside components
window.i18n = initI18n(app);


/* IMPORTANT:ADMINFORTH CUSTOM USES */

app.mount('#app')
