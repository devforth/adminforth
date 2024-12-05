import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
/* IMPORTANT:ADMINFORTH IMPORTS */


import App from './App.vue'
import router from './router'

export const app = createApp(App)
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */

const i18n = createI18n({
  // something vue-i18n options here ...
})
app.use(createPinia())
app.use(router)
app.use(i18n)

/* IMPORTANT:ADMINFORTH CUSTOM USES */

app.mount('#app')
