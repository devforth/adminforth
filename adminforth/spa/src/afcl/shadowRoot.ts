import { inject, type InjectionKey } from 'vue';

// AFCL also renders inside a shadow root (the live examples of the docs): popups, modals and tooltips go to an
// element of that root instead of body, or they lose the styles of the root

export const AFCL_TELEPORT_TARGET: InjectionKey<string | HTMLElement> = Symbol('afclTeleportTarget');

export function useTeleportTarget() {
  return inject(AFCL_TELEPORT_TARGET, 'body');
}

// the focused element as the tree of node sees it: document.activeElement in a page, inside a shadow root the
// element of that root (document.activeElement there is the shadow host)
export function activeElementIn(node: Node) {
  return (node.getRootNode() as Document | ShadowRoot).activeElement;
}
