import tailwindCss from '@/index.scss?inline';

// the CSS of the examples is parsed once for the whole docs page and shared by the shadow roots of all examples

// an example does not inherit the font, color and size of the docs text around it
const HOST_CSS = ':host { all: initial; display: block; border-radius: inherit; }';

const tailwindSheet = new CSSStyleSheet();
tailwindSheet.replaceSync(HOST_CSS + tailwindCss);

export function addShadowRoot(root: ShadowRoot) {
  root.adoptedStyleSheets = [tailwindSheet];
}
