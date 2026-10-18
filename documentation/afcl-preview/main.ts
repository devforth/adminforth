import { createApp, defineAsyncComponent } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import * as afcl from '@/afcl';
import { initI18n } from '@/i18n';
import { coreStore } from './stubs';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/index.scss';

const id = location.hash.slice(1);
const loadExample = import.meta.glob('./examples/*.vue')[`./examples/${id}.vue`];
if (!loadExample) {
  throw new Error(`There is no AFCL example "${id}"`);
}

// the docs page around the iframe owns the light/dark switch
const docsRoot = window.parent.document.documentElement;
function syncTheme() {
  const dark = docsRoot.dataset.theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  coreStore.theme = dark ? 'dark' : 'light';
}
syncTheme();
new MutationObserver(syncTheme).observe(docsRoot, { attributeFilter: ['data-theme'] });

const app = createApp(defineAsyncComponent(loadExample));
Object.entries(afcl).forEach(([name, component]) => typeof component === 'object' && app.component(name, component));
app.use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/:path(.*)*', component: { render: () => null } }] }));
initI18n(app);
app.mount('#app');

// the docs page sizes the iframe to the example
new ResizeObserver(() => {
  window.parent.postMessage({ afclPreview: id, height: document.body.offsetHeight }, '*');
}).observe(document.body);
