import tailwindCss from '@/index.scss?inline';

// the CSS of the examples is parsed once for the whole docs page and shared by the shadow roots of all examples

// an example does not inherit the font, color and size of the docs text around it
const HOST_CSS = ':host { all: initial; display: block; border-radius: inherit; }';

const tailwindSheet = new CSSStyleSheet();
tailwindSheet.replaceSync(HOST_CSS + tailwindCss);

// plain CSS which a component imports (vue3-json-viewer) would go to document.head, the build hands it here
const componentSheets: CSSStyleSheet[] = [];
const roots = new Set<ShadowRoot>();

function applySheets(root: ShadowRoot) {
  root.adoptedStyleSheets = [tailwindSheet, ...componentSheets];
}

export function adoptComponentCss(css: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  componentSheets.push(sheet);
  roots.forEach(applySheets);
}

export function addShadowRoot(root: ShadowRoot) {
  roots.add(root);
  applySheets(root);
}

export function removeShadowRoot(root: ShadowRoot) {
  roots.delete(root);
}
