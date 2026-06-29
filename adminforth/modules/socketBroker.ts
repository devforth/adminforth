import { IAdminForth, IWebSocketBroker, IWebSocketClient } from "../types/Back.js";
import { AdminUser } from "../types/Common.js";
import { afLogger } from '../modules/logger.js';

export default class SocketBroker implements IWebSocketBroker {
  clients: IWebSocketClient[] = [];
  topics: { [key: string]: IWebSocketClient[] } = {};
  adminforth: IAdminForth;
  deadCheckerRunning = false;

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
  }

  async startChecker() {
    if (this.deadCheckerRunning) {
      return;
    }
    this.deadCheckerRunning = true;
    
    while (true) {
      await this.checkDeadClients();
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }

  async checkDeadClients() {
    const now = Date.now();
    const deadClients = [];
    for (const client of this.clients) {
      if (now - client.lastPing > 30_000) {
        deadClients.push(client);
      }
    }
    deadClients.forEach(client => {
      client.close();
      delete this.clients[client.id];
    });
  }

  deleteClientFromTopic(client: IWebSocketClient, topic: string) {
    if (!this.topics[topic]) {
      return;
    }
    this.topics[topic] = this.topics[topic].filter(c => c !== client);
  }

  cleanupTopicIfEmpty(topic: string) {
    if (!this.topics[topic]) {
      return;
    }
    if (this.topics[topic].length === 0) {
      delete this.topics[topic];
    }
  }
  
  registerWsClient(client: IWebSocketClient): void {
    this.startChecker();

    if (!this.clients[client.id]) {
      this.clients[client.id] = client;
    }
    client.onMessage(async (message) => {
      const messageText = message.toString();

      if (!messageText.trim()) {
        return;
      }

      if (messageText === 'ping') {
        client.send('pong');
        client.lastPing = Date.now();
        return;
      }

      let data: unknown;

      try {
        data = JSON.parse(messageText);
      } catch (e) {
        client.send(JSON.stringify({ type: 'error', message: 'Invalid websocket message JSON' }));
        return;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        client.send(JSON.stringify({ type: 'error', message: 'Invalid websocket message format' }));
        return;
      }

      const payload = data as { type?: unknown; topic?: unknown };

      if (payload.type !== 'subscribe' && payload.type !== 'unsubscribe') {
        client.send(JSON.stringify({ type: 'error', message: 'Unknown websocket message type' }));
        return;
      }

      if (typeof payload.topic !== 'string' || !payload.topic) {
        client.send(JSON.stringify({ type: 'error', message: 'No topic provided' }));
        return;
      }

      const topic = payload.topic;

      if (payload.type === 'subscribe') {
        if (!topic.startsWith('/opentopic/')) {
          if (this.adminforth.config.auth.websocketTopicAuth) {
            let authResult = false;
            try {
              authResult = await this.adminforth.config.auth.websocketTopicAuth(topic, client.adminUser);
            } catch (e) {
              afLogger.error(`Error in websocketTopicAuth, assuming connection not allowed ${e}`);
            }
            if (!authResult) {
              client.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
              return;
            }
          }
        }
        if (!this.topics[topic]) {
          this.topics[topic] = [];
        }
        if (!this.topics[topic].includes(client)) {
          this.topics[topic].push(client);
        }
        client.topics.add(topic);
        if (this.adminforth.config.auth.websocketSubscribed) {
          (async () => {
            try {
              await this.adminforth.config.auth.websocketSubscribed(topic, client.adminUser);
            } catch (e) {
              afLogger.error(`Error in websocketSubscribed for topic ${topic}, ${e}`);
            }
          })(); // run in background
        }
        return;
      }

      this.deleteClientFromTopic(client, topic);
      this.cleanupTopicIfEmpty(topic);
      client.topics.delete(topic);
    });
    
    client.onClose(() => {
      for (const topic of client.topics) {
        this.deleteClientFromTopic(client, topic);
        this.cleanupTopicIfEmpty(topic);
      }
      delete this.clients[client.id];
    });

    // send ready message
    client.send(JSON.stringify({ type: 'ready' }));

  }

  async publish(topic: string, data: any, filterUsers?: (adminUser: AdminUser) => Promise<boolean>): Promise<void> {
    if (!this.topics[topic]) {
      afLogger.trace(`No clients subscribed to topic ${topic}`);
      return;
    }
    for (const client of this.topics[topic]) {
      if (filterUsers) {
        if (! (await filterUsers(client.adminUser)) ) {
          afLogger.trace(`Client not authorized to receive message ${topic} ${client.adminUser}`);
          continue;
        }
      }
      afLogger.trace(`Sending data to socket ${topic} ${JSON.stringify(data)}`);
      client.send(JSON.stringify({ type: 'message', topic, data }));
    }
  }
 
}
