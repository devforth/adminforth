import { jest } from '@jest/globals';
import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

const hooks = admin.config.auth.adminUserAuthorize as any[];

const login = async (): Promise<string> => {
  const res = await request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'adminforth' });
  return res.headers['set-cookie'][0].split(';')[0];
};

afterEach(() => {
  hooks.length = 0;
});

afterAll(closeApplication);

it('reports a throwing adminUserAuthorize hook as verifyFailed', async () => {
  const cookie = await login();
  const separator = cookie.indexOf('=');
  hooks.push(async () => { throw new Error('db down'); });

  const result = await admin.auth.authorizeByCookies({
    cookies: [{ key: cookie.slice(0, separator), value: cookie.slice(separator + 1) }],
    response: {} as any,
    extra: {} as any,
  });

  expect(result).toEqual({ status: 'verifyFailed', error: expect.objectContaining({ message: 'db down' }) });
});

it('passes a handler error to express instead of rejecting', async () => {
  const cookie = await login();
  const next = jest.fn();

  await admin.express.authorize(async () => { throw new Error('boom'); })(
    { headers: { cookie }, socket: {}, url: '/test' }, {}, next,
  );

  expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
});
