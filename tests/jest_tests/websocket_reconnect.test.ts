import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const TOPIC = '/test/topic';
const websocketSource = new URL('../../adminforth/spa/src/websocket.ts', import.meta.url);

async function loadWebsocket(initialCookie = '') {
  let cookie = initialCookie;
  const sockets: BrowserSocket[] = [];
  const retryCallbacks: (() => void)[] = [];

  class BrowserSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = BrowserSocket.CONNECTING;
    readonly handshakeCookie = cookie;
    readonly sent: string[] = [];
    closeCalls = 0;
    private listeners: Record<string, ((event: { data?: string }) => void)[]> = {};

    constructor(readonly url: string) {
      sockets.push(this);
    }

    addEventListener(type: string, callback: (event: { data?: string }) => void) {
      (this.listeners[type] ??= []).push(callback);
    }

    send(data: string) {
      if (this.readyState !== BrowserSocket.OPEN) {
        throw new Error('Cannot send through a socket that is not open');
      }
      this.sent.push(data);
    }

    close() {
      this.closeCalls++;
      this.readyState = BrowserSocket.CLOSING;
    }

    emit(type: string, data?: string) {
      if (type === 'open') this.readyState = BrowserSocket.OPEN;
      if (type === 'close') this.readyState = BrowserSocket.CLOSED;
      this.listeners[type]?.forEach((callback) => callback({ data }));
    }

    ready() {
      this.emit('open');
      this.emit('message', JSON.stringify({ type: 'ready' }));
    }

    message(topic: string, data: unknown) {
      this.emit('message', JSON.stringify({ type: 'message', topic, data }));
    }
  }

  const context = vm.createContext({
    WebSocket: BrowserSocket,
    window: {
      WebSocket: BrowserSocket,
      location: { protocol: 'https:', host: 'admin.example' },
    },
    console: { log() {}, warn() {}, error() {} },
    setTimeout(callback: () => void, delay: number) {
      retryCallbacks.push(callback);
      return setTimeout(callback, delay);
    },
    clearTimeout,
    setInterval,
    clearInterval,
  });
  const clientId = new vm.SyntheticModule(['getAdminForthClientId'], function () {
    this.setExport('getAdminForthClientId', () => 'browser-client');
  }, { context });
  // Execute the production module with Vite's import.meta.env and browser I/O supplied.
  const module = new vm.SourceTextModule(ts.transpileModule(readFileSync(websocketSource, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  }).outputText, {
    context,
    initializeImportMeta(meta) {
      Object.assign(meta, { env: { VITE_ADMINFORTH_PUBLIC_PATH: '/admin/' } });
    },
  });
  await module.link(() => clientId);
  await module.evaluate();

  const exports = module.namespace as unknown as {
    reconnect(): void;
    default: {
      subscribe(topic: string, callback: (data: unknown) => void): () => void;
    };
  };
  return { ...exports, sockets, retryCallbacks, setCookie(value: string) { cookie = value; } };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('browser websocket reconnect', () => {
  it.each([
    ['login', '', 'session=authenticated'],
    ['logout', 'session=authenticated', ''],
  ])('replaces the connecting handshake on %s', async (_action, before, after) => {
    const client = await loadWebsocket(before);
    const original = client.sockets[0];

    client.setCookie(after);
    client.reconnect();

    expect(original.closeCalls).toBe(1);
    expect(client.sockets).toHaveLength(2);
    expect(original.handshakeCookie).toBe(before);
    expect(client.sockets[1].handshakeCookie).toBe(after);
    expect(client.sockets[1].url).toBe('wss://admin.example/admin/afws?clientId=browser-client');
  });

  it('ignores open, ready, message, and close events from the replaced socket', async () => {
    const client = await loadWebsocket();
    const original = client.sockets[0];
    const delivered: unknown[] = [];
    client.default.subscribe(TOPIC, (data) => delivered.push(data));
    client.reconnect();
    expect(client.sockets).toHaveLength(2);
    const replacement = client.sockets[1];

    original.emit('open');
    jest.advanceTimersByTime(10_000);
    expect(original.sent).toEqual([]);
    expect(replacement.sent).toEqual([]);

    replacement.ready();
    expect(replacement.sent).toEqual([JSON.stringify({ type: 'subscribe', topic: TOPIC })]);
    original.emit('message', JSON.stringify({ type: 'ready' }));
    original.message(TOPIC, 'old session');
    expect(replacement.sent).toHaveLength(1);
    expect(delivered).toEqual([]);

    original.emit('close');
    jest.advanceTimersByTime(10_000);
    expect(client.sockets).toHaveLength(2);
    expect(replacement.sent).toEqual([JSON.stringify({ type: 'subscribe', topic: TOPIC }), 'ping']);
    replacement.message(TOPIC, 'current session');
    expect(delivered).toEqual(['current session']);
  });

  it('cancels a pending automatic retry when an auth change reconnects immediately', async () => {
    const client = await loadWebsocket();
    client.sockets[0].emit('close');
    jest.advanceTimersByTime(1_000);
    client.setCookie('session=authenticated');

    client.reconnect();

    expect(client.sockets).toHaveLength(2);
    expect(jest.getTimerCount()).toBe(1); // Only the existing heartbeat interval remains.
    const replacement = client.sockets[1];
    replacement.ready();
    jest.advanceTimersByTime(1_000);
    expect(client.sockets).toHaveLength(2);
    expect(replacement.handshakeCookie).toBe('session=authenticated');
  });

  it('ignores an already queued retry from a retired socket while the current socket awaits retry', async () => {
    const client = await loadWebsocket();
    client.sockets[0].emit('close');
    const retiredRetry = client.retryCallbacks[0];
    client.reconnect();
    client.sockets[1].emit('close');

    // A cancelled timeout may already have entered the browser's task queue.
    retiredRetry();

    expect(client.sockets).toHaveLength(2);
    jest.advanceTimersByTime(1_999);
    expect(client.sockets).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(client.sockets).toHaveLength(3);
  });

  it('sends topics once at ready and preserves subscriptions across reconnect', async () => {
    const client = await loadWebsocket();
    const received = jest.fn();
    const unsubscribe = client.default.subscribe(TOPIC, received);
    const original = client.sockets[0];
    original.emit('open');
    const removeLate = client.default.subscribe('/late', () => {});

    expect(original.sent).toEqual([]);
    original.emit('message', JSON.stringify({ type: 'ready' }));
    expect(original.sent).toEqual([
      JSON.stringify({ type: 'subscribe', topic: TOPIC }),
      JSON.stringify({ type: 'subscribe', topic: '/late' }),
    ]);
    removeLate();

    client.reconnect();
    expect(client.sockets).toHaveLength(2);
    const replacement = client.sockets[1];
    replacement.ready();
    expect(replacement.sent).toEqual([JSON.stringify({ type: 'subscribe', topic: TOPIC })]);
    replacement.message(TOPIC, 1);
    expect(received).toHaveBeenCalledWith(1);

    unsubscribe();
    expect(replacement.sent).toEqual([
      JSON.stringify({ type: 'subscribe', topic: TOPIC }),
      JSON.stringify({ type: 'unsubscribe', topic: TOPIC }),
    ]);
  });
});
