import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type AfterSessionCreatedHook = (params: {
  pk: string | null,
  username: string,
  sessionId: string,
  expiresInSeconds: number,
  adminforth: any,
  extra?: any,
}) => Promise<void>;

const hooks = admin.config.auth.afterSessionCreated as AfterSessionCreatedHook[];

const login = (rememberMe = false) =>
  request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'adminforth', rememberMe });

const cookieOf = (res: request.Response) => res.headers['set-cookie'][0].split(';')[0];

const sessionIdOf = (cookie: string) =>
  JSON.parse(Buffer.from(cookie.split('.')[1], 'base64url').toString()).sessionId;

afterAll(async () => {
  await closeApplication();
});

afterEach(() => {
  hooks.length = 0;
});

describe('auth.afterSessionCreated', () => {
  it('receives session id which was put into issued token', async () => {
    const seen: { sessionId: string, pk: string | null, username: string }[] = [];
    hooks.push(async ({ sessionId, pk, username }) => { seen.push({ sessionId, pk, username }); });

    const res = await login();

    expect(seen).toHaveLength(1);
    expect(seen[0].sessionId).toEqual(sessionIdOf(cookieOf(res)));
    expect(seen[0].username).toEqual('adminforth');
    expect(seen[0].pk).toBeTruthy();
  });

  it('receives session duration and request data of login request', async () => {
    const seen: { expiresInSeconds: number, headers: Record<string, string> }[] = [];
    hooks.push(async ({ expiresInSeconds, extra }) => { seen.push({ expiresInSeconds, headers: extra.headers }); });

    await login().set('x-some-header', 'value');
    await login(true);

    expect(seen[0].expiresInSeconds).toEqual(24 * 60 * 60);
    expect(seen[0].headers['x-some-header']).toEqual('value');
    // remember me logins last longer, by default 30 days
    expect(seen[1].expiresInSeconds).toEqual(30 * 24 * 60 * 60);
  });

  it('is called for every login, in order of hooks', async () => {
    const called: string[] = [];
    hooks.push(
      async () => { called.push('first'); },
      async () => { called.push('second'); },
    );

    await login();
    await login();

    expect(called).toEqual(['first', 'second', 'first', 'second']);
  });

  it('is not called when credentials are wrong', async () => {
    const called: string[] = [];
    hooks.push(async ({ sessionId }) => { called.push(sessionId); });

    const res = await request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'wrong' });

    expect(res.status).toEqual(401);
    expect(called).toEqual([]);
  });

  it('is awaited before login request is answered', async () => {
    const finished: string[] = [];
    hooks.push(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      finished.push('hook');
    });

    await login();
    finished.push('response');

    expect(finished).toEqual(['hook', 'response']);
  });
});
