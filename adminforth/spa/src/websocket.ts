
const subscriptions: { [topic: string]: ((data: any) => void)[] } = {};

interface ExtendedWebSocket extends WebSocket {
  connected?: boolean;
}

const state: {
  status: 'connecting' | 'connected' | 'disconnected';
  ws: ExtendedWebSocket | null;
} = {
  status: 'connecting',
  ws: null
};

function doPhysicalSubscribe(topic: string) {
  state.ws!.send(JSON.stringify({ type: 'subscribe', topic }));
}

function doPhysicalUnsubscribe(topic: string) {
  state.ws!.send(JSON.stringify({ type: 'unsubscribe', topic }));
}


async function connect () {
  // if socket is not supported return
  if (!window.WebSocket) {
    console.error('Websocket not supported by this browser');
    return;
  }
  if (state.ws?.connected) {
    console.error('🔌 AFWS already connected');
    return;
  }

  let base = import.meta.env.VITE_ADMINFORTH_PUBLIC_PATH || '';
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  state.ws = new WebSocket(`${
    window.location.protocol === 'http:' ? 'ws' : 'wss'
  }://${window.location.host}${base}/afws`);
  state.status = 'connecting';
  state.ws.addEventListener('open', () => {
    console.log('🔌 AFWS connected');
    state.status = 'connected';

  });
  state.ws.addEventListener('message', (event) => {
    const data = event.data.toString();
    if (data === 'pong') {
      return;
    }
    console.log('🔌 AFWS message', data);
    
    const message = JSON.parse(data);
    if (message.type === 'ready') {
      Object.keys(subscriptions).forEach((topic) => {
        doPhysicalSubscribe(topic);
      });
      return
    }
    if (message.type === 'message') {
      const topic = message.topic;
      const data = message.data;
      if (subscriptions[topic]) {
        for (const callback of subscriptions[topic]) {
          callback(data);
        }
      }
    }
  });
  state.ws.addEventListener('close', () => {
    console.log('🔌 AFWS disconnected');
    setTimeout(() => {
      console.log('🔌 AFWS reconnecting after close');
      connect();
      // if it is first time, reconnect instantly
    }, state.status === 'connected' ? 0 : 2_000);
    state.status = 'disconnected';
  });
}

try {
  connect();
} catch (e) {
  console.error('🔌 AFWS failed to connect', e);
}

export function reconnect() {
  console.log('🔌 AFWS reconnect initiated');
  // disconnect if already connected
  if (state.status === 'connected') {
    state.ws!.close();
  }
  
}

setInterval(() => {
  if (state.status === 'connected') {
    state.ws!.send('ping');
  }
}, 10_000);


export default {
  subscribe(topic: string, callback: (data: any) => void): void {
    const isFirstSubscription = !subscriptions[topic];
    if (!subscriptions[topic]) {
      subscriptions[topic] = [];
    }
    subscriptions[topic].push(callback);
    if (isFirstSubscription && state.status === 'connected') {
      doPhysicalSubscribe(topic);
    }
  },

  unsubscribe(topic: string): void {
    if (!subscriptions[topic]) {
      return;
    }
    delete subscriptions[topic];
    if (state.status === 'connected') {
      doPhysicalUnsubscribe(topic);
    }
  },

  unsubscribeByPrefix(prefix: string): void {
    Object.keys(subscriptions)
      .filter((topic) => topic.startsWith(prefix))
      .forEach((topic) => {
        delete subscriptions[topic];
        if (state.status === 'connected') {
          doPhysicalUnsubscribe(topic);
        }
      });
  },

  unsubscribeAll(): void {
    Object.keys(subscriptions).forEach((topic) => {
      delete subscriptions[topic];
      if (state.status === 'connected') {
        doPhysicalUnsubscribe(topic);
      }
    });
  }
  
}