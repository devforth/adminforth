import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type LoginFailedHook = (params: { username: string, pk: string | null, reason: string, adminforth: any, extra: any }) => Promise<void>;
type LoginAttemptHook = (params: { username: string, adminforth: any, extra: any, tr: any }) => Promise<{ ok: boolean, error?: string }>;

const hooks = admin.config.auth.afterLoginFailed as LoginFailedHook[];
const loginAttemptHooks = admin.config.auth.beforeLoginAttempt as LoginAttemptHook[];

const login = (username: string, password: string) =>
  request(app).post('/adminapi/v1/login').send({ username, password });

afterAll(async () => {
  await closeApplication();
});

afterEach(() => {
  hooks.length = 0;
  loginAttemptHooks.length = 0;
});

describe('auth.afterLoginFailed', () => {
  it('receives reason and pk of user for every kind of failed attempt', async () => {
    const calls: { username: string, pk: string | null, reason: string }[] = [];
    hooks.push(async ({ username, pk, reason }) => { calls.push({ username, pk, reason }); });

    await login('adminforth', 'wrong password');
    await login('nobody@example.com', 'wrong password');
    loginAttemptHooks.push(async () => ({ ok: false, error: 'Captcha verification failed' }));
    await login('adminforth', 'adminforth');

    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual({ username: 'adminforth', pk: expect.anything(), reason: 'invalid_password' });
    expect(calls[1]).toEqual({ username: 'nobody@example.com', pk: null, reason: 'user_not_found' });
    expect(calls[2]).toEqual({ username: 'adminforth', pk: null, reason: 'rejected' });
  });

  it('receives normalized username and request data', async () => {
    const calls: { username: string, headers: Record<string, string> }[] = [];
    hooks.push(async ({ username, extra }) => { calls.push({ username, headers: extra.headers }); });

    await request(app)
      .post('/adminapi/v1/login')
      .set('x-some-header', 'value')
      .send({ username: '  ADMINFORTH  ', password: 'wrong password' });

    expect(calls).toHaveLength(1);
    expect(calls[0].username).toEqual('adminforth');
    expect(calls[0].headers['x-some-header']).toEqual('value');
  });

  it('is not called for successful login', async () => {
    let called = false;
    hooks.push(async () => { called = true; });

    const res = await login('adminforth', 'adminforth');

    expect(res.status).toEqual(200);
    expect(called).toBe(false);
  });

  it('keeps 401 response when hook throws and calls the next hooks', async () => {
    let secondCalled = false;
    hooks.push(
      async () => { throw new Error('Log storage is down'); },
      async () => { secondCalled = true; },
    );

    const res = await login('adminforth', 'wrong password');

    expect(res.status).toEqual(401);
    expect(res.body).toEqual({ error: 'Invalid username or password' });
    expect(secondCalled).toBe(true);
  });
});
