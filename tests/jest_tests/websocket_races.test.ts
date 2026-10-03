import { jest } from '@jest/globals';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import SocketBroker from '../../adminforth/modules/socketBroker';
import ExpressServer from '../../adminforth/servers/express';
import { WebSocketClient } from '../../adminforth/servers/common';

const require = createRequire(new URL('../../adminforth/package.json', import.meta.url));
const express = require('express');
const { WebSocket } = require('ws');
const TOPIC = '/test/pending';
const USER = { pk: 'alice', dbUser: { id: 'alice' } };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture(topicAuth: (topic: string, user: any) => Promise<boolean>) {
  const subscribed = jest.fn();
  const admin = { config: { auth: { websocketTopicAuth: topicAuth, websocketSubscribed: subscribed } } };
  const broker = new SocketBroker(admin as any);
  jest.spyOn(broker, 'startChecker').mockImplementation(async () => {});
  let onMessage!: (message: string) => Promise<void>;
  let onClose!: () => void;
  const sent: any[] = [];
  const client = new WebSocketClient({
    id: 'test-client', adminUser: USER,
    authorize: async () => ({ status: 'ok', adminUser: USER }),
    send: (message: string) => sent.push(JSON.parse(message)),
    close: () => onClose(),
    onMessage: (handler: typeof onMessage) => { onMessage = handler; },
    onClose: (handler: typeof onClose) => { onClose = handler; },
  });
  broker.registerWsClient(client);
  return {
    broker, client, sent, subscribed,
    message: (type: string, topic = TOPIC) => onMessage(JSON.stringify({ type, topic })),
    close: () => onClose(),
  };
}

describe('pending websocket subscriptions', () => {
  it('unsubscribe cancels an earlier authorization before a later publish', async () => {
    const auth = deferred<boolean>();
    const f = fixture(() => auth.promise);
    const pending = f.message('subscribe');
    await f.message('unsubscribe');
    auth.resolve(true);
    await pending;
    await f.broker.publish(TOPIC, { after: 'unsubscribe' });

    expect(f.broker.topics[TOPIC]).toBeUndefined();
    expect(f.client.topics.size).toBe(0);
    expect(f.subscribed).not.toHaveBeenCalled();
    expect(f.sent).toEqual([{ type: 'ready' }]);
  });

  it('close cancels authorization and avoids filters for disconnected users', async () => {
    const auth = deferred<boolean>();
    const f = fixture(() => auth.promise);
    const pending = f.message('subscribe');
    f.close();
    auth.resolve(true);
    await pending;
    await f.broker.checkDeadClients();
    await f.broker.reauthorizeClients();
    const filter = jest.fn(async () => true);
    await f.broker.publish(TOPIC, {}, filter);

    expect(f.broker.clients.size).toBe(0);
    expect(f.broker.topics[TOPIC]).toBeUndefined();
    expect(f.client.topics.size).toBe(0);
    expect(f.subscribed).not.toHaveBeenCalled();
    expect(filter).not.toHaveBeenCalled();
  });

  it('an older allowed subscribe cannot override a newer denied resubscribe', async () => {
    const older = deferred<boolean>();
    const newer = deferred<boolean>();
    let calls = 0;
    const f = fixture(() => (++calls === 1 ? older.promise : newer.promise));
    const first = f.message('subscribe');
    await f.message('unsubscribe');
    const second = f.message('subscribe');
    newer.resolve(false);
    await second;
    older.resolve(true);
    await first;

    expect(f.broker.topics[TOPIC]).toBeUndefined();
    expect(f.subscribed).not.toHaveBeenCalled();
    expect(f.sent).toEqual([{ type: 'ready' }, { type: 'error', message: 'Unauthorized' }]);
  });

  it('an older denial cannot cancel a still-pending resubscribe', async () => {
    const older = deferred<boolean>();
    const newer = deferred<boolean>();
    let calls = 0;
    const f = fixture(() => (++calls === 1 ? older.promise : newer.promise));
    const first = f.message('subscribe');
    await f.message('unsubscribe');
    const second = f.message('subscribe');
    older.resolve(false);
    await first;
    expect(f.broker.topics[TOPIC]).toBeUndefined();
    expect(f.sent).toEqual([{ type: 'ready' }]);
    newer.resolve(true);
    await second;
    await f.broker.publish(TOPIC, { value: 1 });

    expect(f.broker.topics[TOPIC]).toEqual([f.client]);
    expect(f.subscribed).toHaveBeenCalledTimes(1);
    expect(f.sent).toEqual([{ type: 'ready' }, { type: 'message', topic: TOPIC, data: { value: 1 } }]);
  });
});

it('does not register a transport closed while handshake authorization was pending', async () => {
  const entered = deferred<void>();
  const authorization = deferred<any>();
  const authorize = jest.fn(async () => {
    entered.resolve();
    return authorization.promise;
  });
  const admin = {
    config: { baseUrl: '', auth: {} },
    auth: { authorizeByCookies: authorize },
    formatAdminForth: () => 'WebSocket regression fixture',
    websocket: undefined as any,
  };
  const broker = new SocketBroker(admin as any);
  admin.websocket = broker;
  jest.spyOn(broker, 'startChecker').mockImplementation(async () => {});
  const registration = jest.spyOn(broker, 'registerWsClient');
  const server = new ExpressServer(admin as any) as any;
  server.expressApp = express();
  server.setupWsServer();
  server.server.listen(0, '127.0.0.1');
  await once(server.server, 'listening');
  const socket = new WebSocket(`ws://127.0.0.1:${server.server.address().port}/afws`);
  try {
    await once(socket, 'open');
    await entered.promise;
    const closed = once(socket, 'close');
    socket.close();
    await closed;
    authorization.resolve({ status: 'ok', adminUser: USER });
    // Drain the handshake continuation before checking its observable effects.
    await new Promise<void>((resolve) => setImmediate(resolve));
    await broker.reauthorizeClients();

    expect(registration).not.toHaveBeenCalled();
    expect(broker.clients.size).toBe(0);
    expect(authorize).toHaveBeenCalledTimes(1);
  } finally {
    authorization.resolve({ status: 'noToken' });
    socket.terminate();
    await new Promise<void>((resolve) => server.server.close(resolve));
  }
});
