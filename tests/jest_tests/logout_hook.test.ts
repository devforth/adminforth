import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type LogoutHook = (params: { adminUser: any, adminforth: any, extra: any, tr: any }) => Promise<void>;

const hooks = admin.config.auth.beforeLogout as LogoutHook[];

const logout = (cookie?: string) => {
  const req = request(app).post('/adminapi/v1/logout');
  return (cookie ? req.set("Cookie", cookie) : req).send({});
};

const loginCookie = async (): Promise<string> => {
  const res = await request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'adminforth' });
  return res.headers['set-cookie'][0].split(';')[0];
};

afterAll(async () => {
  await closeApplication();
});

afterEach(() => {
  hooks.length = 0;
});

describe('auth.beforeLogout', () => {
  it('receives logged in user, request data and translate function', async () => {
    const calls: { username: string, headers: Record<string, string>, translated: string }[] = [];
    hooks.push(async ({ adminUser, extra, tr }) => {
      calls.push({
        username: adminUser.username,
        headers: extra.headers,
        translated: await tr('Invalid username or password', 'errors'),
      });
    });

    const res = await logout(await loginCookie()).set('x-some-header', 'value');

    expect(res.status).toEqual(200);
    expect(res.body).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].username).toEqual('adminforth');
    expect(calls[0].headers['x-some-header']).toEqual('value');
    expect(calls[0].translated).toEqual('Invalid username or password');
  });

  it('is called before auth cookie is removed and does not block logout', async () => {
    const called: string[] = [];
    hooks.push(
      async () => { called.push('first'); },
      async () => { called.push('second'); },
    );

    const res = await logout(await loginCookie());

    expect(res.status).toEqual(200);
    expect(called).toEqual(['first', 'second']);
    expect(res.headers['set-cookie'][0]).toContain('adminforth_');
    expect(res.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('passes null user when session is missing or invalid', async () => {
    const users: (any | null)[] = [];
    hooks.push(async ({ adminUser }) => { users.push(adminUser); });

    const withoutCookie = await logout();
    const withBrokenCookie = await logout(`adminforth_${admin.config.customization.brandNameSlug}_jwt=not-a-jwt`);

    expect(withoutCookie.status).toEqual(200);
    expect(withBrokenCookie.status).toEqual(200);
    expect(users).toEqual([null, null]);
  });
});
