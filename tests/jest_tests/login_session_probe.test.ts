import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import { hasLiveSession, sessionSurvives401 } from '../../adminforth/spa/src/utils/session';

function stubFetch(impl: any) {
  const fetchMock = jest.fn(impl);
  (globalThis as any).fetch = fetchMock;
  return fetchMock;
}

function stubStorage(value: string | null) {
  (globalThis as any).localStorage = { getItem: () => value };
}

const ok = async () => ({ status: 200, json: async () => ({ ok: true }) });

afterEach(() => {
  delete (globalThis as any).fetch;
  delete (globalThis as any).localStorage;
});

describe('live session probe', () => {
  it('reports a live session when the server answers 200 and says so', async () => {
    stubFetch(ok);
    await expect(hasLiveSession()).resolves.toBe(true);
  });

  it.each([[401], [403], [415], [500]])('reports no session on %p', async (status) => {
    stubFetch(async () => ({ status, json: async () => ({ ok: true }) }));
    await expect(hasLiveSession()).resolves.toBe(false);
  });

  it('reports no session when something else answers 200', async () => {
    // a captive portal or proxy sign-in page, which would otherwise read as a live session
    stubFetch(async () => ({ status: 200, json: async () => ({ portal: 'sign in' }) }));
    await expect(hasLiveSession()).resolves.toBe(false);

    stubFetch(async () => ({ status: 200, json: async () => { throw new SyntaxError('not json'); } }));
    await expect(hasLiveSession()).resolves.toBe(false);
  });

  it('reports no session when the request fails or times out', async () => {
    stubFetch(async () => { throw new TypeError('Failed to fetch'); });
    await expect(hasLiveSession()).resolves.toBe(false);

    stubFetch(async () => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); });
    await expect(hasLiveSession()).resolves.toBe(false);
  });

  it('asks the authenticated endpoint the way the server requires, and gives up', async () => {
    const fetchMock = stubFetch(ok);

    await hasLiveSession();

    const [url, options] = fetchMock.mock.calls[0] as [string, any];
    expect(url).toContain('/adminapi/v1/check_auth');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBeTruthy();
    // without this the probe can hang, and it runs on the path that redirects to login
    expect(options.signal).toBeDefined();
  });
});

describe('deciding whether a 401 ended the session', () => {
  it('keeps a session the server still honours', async () => {
    stubStorage('true');
    stubFetch(ok);
    await expect(sessionSurvives401()).resolves.toBe(true);
  });

  it('accepts the 401 when the server agrees the session is gone', async () => {
    stubStorage('true');
    stubFetch(async () => ({ status: 401, json: async () => ({}) }));
    await expect(sessionSurvives401()).resolves.toBe(false);
  });

  it.each([['false'], [null]])('does not ask at all when the client never had a session (%p)', async (stored) => {
    stubStorage(stored);
    const fetchMock = stubFetch(ok);

    await expect(sessionSurvives401()).resolves.toBe(false);

    // anonymous visitors must not pay for a probe on every 401 the app makes
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

it('the 401 handler checks before tearing the session down', async () => {
  const source = await fs.readFile(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../adminforth/spa/src/utils/utils.ts'),
    'utf8',
  );
  const handler = source.slice(source.indexOf('export async function handleNotAuthorized'));

  // it has to act on the answer, not merely ask
  expect(handler).toMatch(/if \(await sessionSurvives401\(\)\) \{\s*return;/);
  expect(handler.indexOf('sessionSurvives401')).toBeLessThan(handler.indexOf('unauthorize()'));
});

it('the app repairs the flag from the config it already fetches', async () => {
  const source = await fs.readFile(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../adminforth/spa/src/App.vue'),
    'utf8',
  );
  const loadConfig = source.slice(source.indexOf('async function loadConfig'));

  // a live session must set the flag back, otherwise only a fresh login ever does
  expect(loadConfig).toMatch(/if \(resp\?\.loggedIn\) \{[\s\S]{0,400}?userStore\.authorize\(\)/);
  expect(loadConfig.indexOf('userStore.authorize()')).toBeLessThan(loadConfig.indexOf('handleNotAuthorized()'));
});

it('asks once when a whole page of calls fails at the same moment', async () => {
  stubStorage('true');
  const fetchMock = stubFetch(ok);

  const answers = await Promise.all([sessionSurvives401(), sessionSurvives401(), sessionSurvives401()]);

  expect(answers).toEqual([true, true, true]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
