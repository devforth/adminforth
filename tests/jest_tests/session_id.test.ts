import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type AuthorizeHook = (params: { adminUser: any }) => Promise<{ allowed?: boolean, error?: string }>;

const authorizeHooks = admin.config.auth.adminUserAuthorize as AuthorizeHook[];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const login = async (): Promise<string> => {
  const res = await request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'adminforth' });
  return res.headers['set-cookie'][0].split(';')[0];
};

const tokenPayload = (cookie: string) =>
  JSON.parse(Buffer.from(cookie.split('.')[1], 'base64url').toString());

const checkAuth = (cookie: string) =>
  request(app).post('/adminapi/v1/check_auth').set('Cookie', cookie).send({});

afterAll(async () => {
  await closeApplication();
});

afterEach(() => {
  authorizeHooks.length = 0;
});

describe('auth session id', () => {
  it('puts unique session id into auth token on every login', async () => {
    const first = tokenPayload(await login());
    const second = tokenPayload(await login());

    expect(first.sessionId).toMatch(UUID_RE);
    expect(second.sessionId).toMatch(UUID_RE);
    expect(first.sessionId).not.toEqual(second.sessionId);
  });

  it('exposes same session id to every request done with one login', async () => {
    const seen: string[] = [];
    authorizeHooks.push(async ({ adminUser }) => { seen.push(adminUser.sessionId); return { allowed: true }; });

    const cookie = await login();
    await checkAuth(cookie);
    await checkAuth(cookie);

    expect(seen).toEqual([tokenPayload(cookie).sessionId, tokenPayload(cookie).sessionId]);
  });

  it('keeps sessions of parallel logins apart', async () => {
    const seen: string[] = [];
    authorizeHooks.push(async ({ adminUser }) => { seen.push(adminUser.sessionId); return { allowed: true }; });

    const firstCookie = await login();
    const secondCookie = await login();
    await checkAuth(firstCookie);
    await checkAuth(secondCookie);

    expect(seen).toEqual([tokenPayload(firstCookie).sessionId, tokenPayload(secondCookie).sessionId]);
    expect(seen[0]).not.toEqual(seen[1]);
  });
});
