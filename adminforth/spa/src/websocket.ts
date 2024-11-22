
const subscriptions: { [topic: string]: ((data: any) => void)[] } = {};
const state: {
  status: 'connecting' | 'connected' | 'disconnected';
  ws: WebSocket | null;
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


async function init() {
  state.ws = new WebSocket(`${
    window.location.protocol === 'http:' ? 'ws' : 'wss'
  }://${window.location.host}/afws`);
  state.status = 'connecting';
  state.ws.addEventListener('open', () => {
    console.log('connected');
    state.status = 'connected';
    Object.keys(subscriptions).forEach((topic) => {
      doPhysicalSubscribe(topic);
    });
  });
  state.ws.addEventListener('message', (event) => {
    const data = event.data.toString();
    if (data === 'pong') {
      return;
    }
    const message = JSON.parse(data);
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
    console.log('disconnected');
    state.status = 'disconnected';
  });
}

setInterval(() => {
  if (state.status === 'connected') {
    state.ws!.send('ping');
  }
}, 10_000);

try {
  init();
} catch (e) {
  console.error('Failed to initialize websocket', e);
}

export default {
  subscribe(topic: string, callback: (data: any) => void): void {
    if (!subscriptions[topic]) {
      subscriptions[topic] = [];
    }
    subscriptions[topic].push(callback);
    if (state.status === 'connected') {
      doPhysicalSubscribe(topic);
    }
  },

  unsubscribe(topic: string): void {
    delete subscriptions[topic];
    if (state.status === 'connected') {
      doPhysicalUnsubscribe(topic);
    }
  }
  
}