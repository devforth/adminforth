import { jest } from '@jest/globals';
import request from 'supertest';
import { admin, app, closeApplication } from './authTestApp';

type AuthorizeHook = (params: { adminUser: any }) => Promise<{ allowed?: boolean, error?: string }>;

const authorizeHooks = admin.config.auth.adminUserAuthorize as AuthorizeHook[];
const broker = admin.websocket as any;

const TOPIC = '/test/topic';
const denyAll: AuthorizeHook = async () => ({ allowed: false, error: 'Session was revoked' });

const sockets: WebSocket[] = [];
let wsOrigin: string;

const login = async (): Promise<string> => {
  const res = await request(app).post('/adminapi/v1/login').send({ username: 'adminforth', password: 'adminforth' });
  return res.headers['set-cookie'][0].split(';')[0];
};

const nextMessage = (ws: WebSocket): Promise<any> => new Promise((resolve) => {
  ws.addEventListener('message', (event) => resolve(JSON.parse(event.data)), { once: true });
});

const connect = async (cookie: string): Promise<WebSocket> => {
  const ws = new (WebSocket as any)(`${wsOrigin}/afws?clientId=test`, { headers: { cookie } });
  sockets.push(ws);
  expect(await nextMessage(ws)).toEqual({ type: 'ready' });
  return ws;
};

const subscribe = (ws: WebSocket, topic: string): Promise<void> => new Promise((resolve) => {
  admin.config.auth.websocketSubscribed = async (subscribedTopic) => {
    if (subscribedTopic === topic) {
      resolve();
    }
  };
  ws.send(JSON.stringify({ type: 'subscribe', topic }));
});

beforeAll(async () => {
  // checker loop would keep jest running, tests call its steps directly
  jest.spyOn(broker, 'startChecker').mockImplementation(async () => {});
  await new Promise((resolve) => admin.express.listen(0, resolve));
  wsOrigin = admin.express.getInternalApiOrigin().replace('http', 'ws');
});

afterAll(async () => {
  sockets.forEach((ws) => ws.close());
  await new Promise((resolve) => (admin.express as any).server.close(resolve));
  await closeApplication();
});

afterEach(() => {
  authorizeHooks.length = 0;
});

describe('websocket auth', () => {
  it('delivers topic messages to authorized user', async () => {
    const ws = await connect(await login());
    await subscribe(ws, TOPIC);

    const message = nextMessage(ws);
    await admin.websocket.publish(TOPIC, { value: 1 });

    expect(await message).toEqual({ type: 'message', topic: TOPIC, data: { value: 1 } });
  });

  it('connects user denied by adminUserAuthorize as anonymous', async () => {
    const cookie = await login();
    authorizeHooks.push(denyAll);
    const ws = await connect(cookie);

    const message = nextMessage(ws);
    ws.send(JSON.stringify({ type: 'subscribe', topic: TOPIC }));

    expect(await message).toEqual({ type: 'error', message: 'Unauthorized' });
  });

  it('closes connection of user denied by adminUserAuthorize after handshake', async () => {
    const ws = await connect(await login());
    await subscribe(ws, TOPIC);

    const closed = new Promise((resolve) => ws.addEventListener('close', resolve, { once: true }));
    authorizeHooks.push(denyAll);
    await broker.reauthorizeClients();

    await closed;
  });

  it('keeps connection of user who is still authorized', async () => {
    const ws = await connect(await login());
    await subscribe(ws, TOPIC);

    await broker.reauthorizeClients();

    const message = nextMessage(ws);
    await admin.websocket.publish(TOPIC, { value: 2 });
    expect(await message).toEqual({ type: 'message', topic: TOPIC, data: { value: 2 } });
  });
});
