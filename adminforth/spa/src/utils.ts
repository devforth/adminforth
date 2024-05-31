
import router from "./router";


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
