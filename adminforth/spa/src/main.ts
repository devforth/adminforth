import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
/* IMPORTANT:ADMINFORTH IMPORTS */


import App from './App.vue'
import router from './router'
import { initI18n } from './i18n'

export const app: ReturnType<typeof createApp> = createApp(App)
/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */

app.use(createPinia())
app.use(router)

// get access to i18n instance outside components
initI18n(app);

// Chrome steps a focused number input on wheel, so scrolling the page with the cursor over the field
// silently changes a price or amount; blurring it first lets the page scroll and keeps the value
document.addEventListener('wheel', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'number' && e.target === document.activeElement) {
    e.target.blur();
  }
}, { passive: true });


/* IMPORTANT:ADMINFORTH CUSTOM USES */

app.mount('#app')
