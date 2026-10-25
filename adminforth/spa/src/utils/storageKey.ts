// localStorage is shared by every app on the same origin, so keys are scoped by brand like the auth cookie
export function lsKey(name: string): string {
  return `af_${import.meta.env.VITE_ADMINFORTH_BRAND_SLUG}_${name}`;
}
