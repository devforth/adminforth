import { createApp } from 'vue'
import { createPinia } from 'pinia'
/* IMPORTANT:ADMINFORTH IMPORTS */


import App from './App.vue'
import router from './router'

const app = createApp(App)
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */


app.use(createPinia())
app.use(router)

/* IMPORTANT:ADMINFORTH CUSTOM USES */

app.mount('#app')
