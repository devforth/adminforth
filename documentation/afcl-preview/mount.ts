import { defineCustomElement, h, provide, useShadowRoot, type Component } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { initI18n } from '@/i18n';
import { AFCL_TELEPORT_TARGET } from '@/afcl/shadowRoot';
import geistCss from '@fontsource-variable/geist?inline';
import geistMonoCss from '@fontsource-variable/geist-mono?inline';
import { coreStore } from './stubs';
import { addShadowRoot } from './shadowStyles';

// <AfclPreview> of the docs calls mountExample() to render its example right in the page: a custom element with a
// shadow root keeps the styles of the docs and of AFCL apart, while Vue, AFCL and their CSS load once per page

const loadExample = import.meta.glob<{ default: Component }>('./examples/*.vue');

// @font-face does not work inside a shadow root, the docs page gets it
const fonts = document.createElement('style');
fonts.textContent = geistCss + geistMonoCss;
document.head.append(fonts);

// the docs page owns the light/dark switch
const docsRoot = document.documentElement;
const examples = new Set<HTMLElement>();

function isDark() {
  return docsRoot.dataset.theme === 'dark';
}

new MutationObserver(() => {
  coreStore.theme = isDark() ? 'dark' : 'light';
  examples.forEach((el) => el.classList.toggle('dark', isDark()));
}).observe(docsRoot, { attributeFilter: ['data-theme'] });
coreStore.theme = isDark() ? 'dark' : 'light';

function exampleRoot(example: Component) {
  return {
    setup() {
      // popups, modals and tooltips of the example go here instead of body, see @/afcl/shadowRoot
      const teleportTarget = document.createElement('div');
      teleportTarget.style.position = 'relative';
      useShadowRoot()!.append(teleportTarget);
      provide(AFCL_TELEPORT_TARGET, teleportTarget);
      return () => h('div', {
        class: 'bg-lightHtml text-lightListTableText dark:bg-darkHtml dark:text-darkListTableText antialiased p-4 sm:p-6',
        style: { borderRadius: 'inherit' },
      }, h(example));
    },
  };
}

export async function mountExample(id: string, host: HTMLElement) {
  const tag = `afcl-example-${id}`;
  if (!customElements.get(tag)) {
    const { default: example } = await loadExample[`./examples/${id}.vue`]();
    // another preview of the same page could define it meanwhile
    if (!customElements.get(tag)) {
      customElements.define(tag, defineCustomElement(exampleRoot(example), {
        configureApp(app) {
          initI18n(app);
          app.use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/:path(.*)*', component: { render: () => null } }] }));
        },
      }));
    }
  }
  const el = document.createElement(tag);
  el.classList.toggle('dark', isDark());
  addShadowRoot(el.shadowRoot!);
  examples.add(el);
  host.append(el);
  return () => {
    examples.delete(el);
    el.remove();
  };
}
