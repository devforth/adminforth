// The auth cookie is HttpOnly, so the server is the only place that knows whether a session is live.
export async function hasLiveSession(): Promise<boolean> {
  const baseUrl = (import.meta as any).env?.VITE_ADMINFORTH_PUBLIC_PATH || '';
  try {
    const response = await fetch(`${baseUrl}/adminapi/v1/check_auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200) {
      return false;
    }
    // a proxy or captive portal can answer 200 with its own page, so the body has to say so too
    return (await response.json().catch(() => null))?.ok === true;
  } catch {
    return false;
  }
}

let inFlight: Promise<boolean> | null = null;

/** A 401 can be transient while the cookie is still good. Only worth asking if we thought we were signed in. */
export async function sessionSurvives401(): Promise<boolean> {
  if (localStorage.getItem('isAuthorized') !== 'true') {
    return false;
  }
  // an outage 401s every call on the page at once, and they all want the same answer
  inFlight ??= hasLiveSession().finally(() => { inFlight = null; });
  return inFlight;
}
