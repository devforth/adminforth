import { jest } from '@jest/globals';
import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type LoginAttemptHook = (params: { username: string, adminforth: any, extra: any, tr: any }) => Promise<{ ok: boolean, error?: string }>;

const hooks = admin.config.auth.beforeLoginAttempt as LoginAttemptHook[];

const login = (username: string, password: string) =>
  request(app).post('/adminapi/v1/login').send({ username, password });

afterAll(async () => {
  await closeApplication();
});

afterEach(() => {
  hooks.length = 0;
});

describe('auth.beforeLoginAttempt', () => {
  it('rejects login the same way for valid, invalid and unknown credentials', async () => {
    hooks.push(async () => ({ ok: false, error: 'Captcha verification failed' }));

    const responses = await Promise.all([
      login('adminforth', 'adminforth'),
      login('adminforth', 'wrong password'),
      login('nobody@example.com', 'wrong password'),
    ]);

    for (const res of responses) {
      expect(res.status).toEqual(401);
      expect(res.body).toEqual({ error: 'Captcha verification failed' });
      expect(res.headers['set-cookie']).toBeUndefined();
    }
  });

  it('is called before user is fetched from database', async () => {
    const getData = jest.spyOn(admin.connectors['sqlite'], 'getData');
    hooks.push(async () => ({ ok: false, error: 'Captcha verification failed' }));

    const res = await login('adminforth', 'adminforth');

    expect(res.status).toEqual(401);
    expect(getData).not.toHaveBeenCalled();
    getData.mockRestore();
  });

  it('receives normalized username, request data and translate function', async () => {
    const calls: { username: string, headers: Record<string, string>, translated: string }[] = [];
    hooks.push(async ({ username, extra, tr }) => {
      calls.push({ username, headers: extra.headers, translated: await tr('Captcha verification failed', 'errors') });
      return { ok: true };
    });

    const res = await request(app)
      .post('/adminapi/v1/login')
      .set('x-captcha-token', 'token')
      .send({ username: '  ADMINFORTH  ', password: 'adminforth' });

    expect(res.status).toEqual(200);
    expect(res.body.error).toBeUndefined();
    expect(calls).toHaveLength(1);
    expect(calls[0].username).toEqual('adminforth');
    expect(calls[0].headers['x-captcha-token']).toEqual('token');
    expect(calls[0].translated).toEqual('Captcha verification failed');
  });

  it('stops on first rejecting hook and lets login pass when all hooks allow it', async () => {
    const called: string[] = [];
    hooks.push(
      async () => { called.push('first'); return { ok: true }; },
      async () => { called.push('second'); return { ok: false, error: 'Blocked by second hook' }; },
      async () => { called.push('third'); return { ok: true }; },
    );

    const rejected = await login('adminforth', 'adminforth');
    expect(rejected.status).toEqual(401);
    expect(rejected.body).toEqual({ error: 'Blocked by second hook' });
    expect(called).toEqual(['first', 'second']);

    hooks.length = 0;
    hooks.push(async () => ({ ok: true }));

    const allowed = await login('adminforth', 'adminforth');
    expect(allowed.status).toEqual(200);
    expect(allowed.body).toEqual({ allowedLogin: true });
    expect(allowed.headers['set-cookie']?.[0]).toContain('adminforth_');
  });

  it('answers with generic message when hook rejects without error text', async () => {
    hooks.push(async () => ({ ok: false }));

    const res = await login('adminforth', 'adminforth');

    expect(res.status).toEqual(401);
    expect(res.body).toEqual({ error: 'Operation aborted by hook' });
  });
});
