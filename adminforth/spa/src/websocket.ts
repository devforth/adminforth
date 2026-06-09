
type WebsocketCallback = (data: any) => void;
type Unsubscribe = () => void;
type Subscription = {
  id: number;
  callback: WebsocketCallback;
};

const subscriptions: { [topic: string]: Subscription[] } = {};
let nextSubscriptionId = 1;

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
        for (const subscription of subscriptions[topic]) {
          subscription.callback(data);
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


function unsubscribeSubscription(topic: string, subscriptionId: number): void {
  if (!subscriptions[topic]) {
    return;
  }

  subscriptions[topic] = subscriptions[topic].filter((subscription) => subscription.id !== subscriptionId);
  if (subscriptions[topic].length > 0) {
    return;
  }

  delete subscriptions[topic];
  if (state.status === 'connected') {
    doPhysicalUnsubscribe(topic);
  }
}

export default {
  subscribe(topic: string, callback: WebsocketCallback): Unsubscribe {
    const isFirstSubscription = !subscriptions[topic];
    if (!subscriptions[topic]) {
      subscriptions[topic] = [];
    }
    const subscriptionId = nextSubscriptionId++;
    subscriptions[topic].push({
      id: subscriptionId,
      callback,
    });
    if (isFirstSubscription && state.status === 'connected') {
      doPhysicalSubscribe(topic);
    }

    let isSubscribed = true;
    return () => {
      if (!isSubscribed) {
        return;
      }
      isSubscribed = false;
      unsubscribeSubscription(topic, subscriptionId);
    };
  },

  unsubscribe(topic: string): void {
    console.warn('This method is deprecated because it removes all subscriptions for the topic. Use the unsubscribe function returned by subscribe(), or use unsubscribeByPrefix() when you explicitly need to unsubscribe by topic prefix.');
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
