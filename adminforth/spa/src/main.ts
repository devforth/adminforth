import { createApp } from 'vue'
import { createPinia } from 'pinia'
/* IMPORTANT:ADMIFORTH IMPORTS */


import App from './App.vue'
import router from './router'

const app = createApp(App)
/* IMPORTANT:ADMIFORTH COMPONENT REGISTRATIONS */


app.use(createPinia())
app.use(router)

app.mount('#app')
