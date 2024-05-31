
import router from "./router";
import { resolveComponent } from 'vue';

export async function callApi({path, method, body=undefined} ) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  const fullPath = `${import.meta.env.VITE_ADMINFORTH_PUBLIC_PATH || ''}${path}`;
  const r = await fetch(fullPath, options);
  if (r.status == 401) {
    console.log('router', router);
    router.push({name: 'login'});
    return null;
  }
  return await r.json();
}

export async function callAdminForthApi({ path, method, body=undefined }) {
  try {
    return callApi({path: `/adminapi/v1${path}`, method, body} );
  } catch (e) {
    console.error('error', e);
    return { error: `Unexpected error: ${e}` };
  }
}


export function getIcon(icon: string) {
  // icon format is "feather:icon-name". We need to get IconName in pascal case
  const [iconSet, iconName] = icon.split(':');
  const compName = 'Icon' + iconName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return resolveComponent(compName);
}
