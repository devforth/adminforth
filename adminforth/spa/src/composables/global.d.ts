import type { FrontendAPIInterface } from "@/types/FrontendAPI";

declare global {
  interface Window {
    adminforth: FrontendAPIInterface;
  }
}

export {};