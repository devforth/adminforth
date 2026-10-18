import { createApp, defineAsyncComponent } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
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
app.use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/:path(.*)*', component: { render: () => null } }] }));
initI18n(app);
app.mount('#app');

// the docs page sizes the iframe to the example, and asks for the height again once it listens
// offsetHeight rounds a fractional height down as well, the frame then is a bit short and shows a scrollbar
function postHeight() {
  window.parent.postMessage({ afclPreview: id, height: Math.ceil(document.body.getBoundingClientRect().height) }, '*');
}
new ResizeObserver(postHeight).observe(document.body);
window.addEventListener('message', (e) => e.data === 'afclPreviewHeight' && postHeight());
