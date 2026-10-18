import type { InjectionKey } from 'vue';

export type DropdownMenuPlacement = 'bottom-start' | 'bottom-end' | 'left-start' | 'right-start';

export interface DropdownMenuContext {
  // called by DropdownMenuItem after its click handlers ran
  itemSelected: () => void;
}

export const DROPDOWN_MENU_KEY: InjectionKey<DropdownMenuContext> = Symbol('afcl-dropdown-menu');
