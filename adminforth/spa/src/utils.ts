

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
  return await r.json();
}

export async function callAdminForthApi({ path, method, body=undefined }) {
  return callApi({path: `/adminapi/v1${path}`, method, body} );
}
