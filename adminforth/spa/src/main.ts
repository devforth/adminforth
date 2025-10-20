import { createApp } from 'vue'
import { createPinia } from 'pinia'
/* IMPORTANT:ADMINFORTH IMPORTS */


import App from './App.vue'
import router from './router'

export const app: ReturnType<typeof createApp> = createApp(App)
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */

app.use(createPinia())
app.use(router)


/* IMPORTANT:ADMINFORTH CUSTOM USES */

app.mount('#app')
