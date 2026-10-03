import pLimit from 'p-limit';
import { IAdminForth, IWebSocketBroker, IWebSocketClient } from "../types/Back.js";
import { AdminUser } from "../types/Common.js";
import { afLogger } from '../modules/logger.js';

const PUBLISH_FILTER_CONCURRENCY = 10;
const REAUTHORIZE_CONCURRENCY = 10;

export default class SocketBroker implements IWebSocketBroker {
  clients = new Map<string, IWebSocketClient>();
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
      await this.reauthorizeClients();
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }

  async checkDeadClients() {
    const now = Date.now();
    for (const client of this.clients.values()) {
      if (now - client.lastPing > 30_000) {
        client.close();
        this.clients.delete(client.id);
      }
    }
  }

  /**
   * Closes connections of users who lost access after the handshake (revoked session, deactivated or deleted user,
   * expired jwt), so they stop receiving topic messages. Frontend reconnects and passes handshake as anonymous.
   */
  async reauthorizeClients() {
    const limit = pLimit(REAUTHORIZE_CONCURRENCY);
    await Promise.all(
      [...this.clients.values()]
        .filter((client) => client.adminUser)
        .map((client) => limit(async () => {
          try {
            const result = await client.authorize();
            if (result.status === 'ok') {
              // keeps dbUser fresh for websocketTopicAuth and publish filters
              client.adminUser = result.adminUser;
            } else if (result.status === 'verifyFailed') {
              // server side problem, e.g. database is not available, so keep the connection and retry on next check
              afLogger.error(`Failed to verify websocket client ${client.id}: ${result.error}`);
            } else {
              client.close();
            }
          } catch (e) {
            afLogger.error(`Failed to authorize websocket client ${client.id}: ${e}`);
          }
        }))
    );
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
    afLogger.info(`Registering new WebSocket client ${client.id}`);
    this.startChecker();

    this.clients.set(client.id, client);
    const pendingSubscriptions = new Map<string, object>();
    client.onMessage(async (message) => {
      if (this.clients.get(client.id) !== client) {
        return;
      }
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
        // Only the latest subscribe intent may commit after asynchronous authorization.
        const subscription = {};
        pendingSubscriptions.set(topic, subscription);
        let authResult = true;
        if (!topic.startsWith('/opentopic/')) {
          if (this.adminforth.config.auth.websocketTopicAuth) {
            authResult = false;
            try {
              authResult = await this.adminforth.config.auth.websocketTopicAuth(topic, client.adminUser);
            } catch (e) {
              afLogger.error(`Error in websocketTopicAuth, assuming connection not allowed ${e}`);
            }
          }
        }
        if (this.clients.get(client.id) !== client || pendingSubscriptions.get(topic) !== subscription) {
          return;
        }
        pendingSubscriptions.delete(topic);
        if (!authResult) {
          client.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
          return;
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

      pendingSubscriptions.delete(topic);
      this.deleteClientFromTopic(client, topic);
      this.cleanupTopicIfEmpty(topic);
      client.topics.delete(topic);
    });
    
    client.onClose(() => {
      pendingSubscriptions.clear();
      for (const topic of client.topics) {
        this.deleteClientFromTopic(client, topic);
        this.cleanupTopicIfEmpty(topic);
      }
      client.topics.clear();
      this.clients.delete(client.id);
    });

    // send ready message
    client.send(JSON.stringify({ type: 'ready' }));

  }

  async publish(topic: string, data: any, filterUsers?: (adminUser: AdminUser) => Promise<boolean>): Promise<void> {
    if (!this.topics[topic]) {
      afLogger.trace(`No clients subscribed to topic ${topic}`);
      return;
    }
    const message = JSON.stringify({ type: 'message', topic, data });

    if (!filterUsers) {
      for (const client of this.topics[topic]) {
        afLogger.trace(`Sending data to socket ${topic} ${JSON.stringify(data)}`);
        client.send(message);
      }
      return;
    }

    const limit = pLimit(PUBLISH_FILTER_CONCURRENCY);
    await Promise.all(
      this.topics[topic].map((client) => limit(async () => {
        if (! (await filterUsers(client.adminUser)) ) {
          afLogger.trace(`Client not authorized to receive message ${topic} ${client.adminUser}`);
          return;
        }
        afLogger.trace(`Sending data to socket ${topic} ${JSON.stringify(data)}`);
        client.send(message);
      }))
    );
  }
 
}
