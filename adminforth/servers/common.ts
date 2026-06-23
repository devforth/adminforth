import { IWebSocketClient } from "../types/Back.js";
import { AdminUser } from "../types/Common.js";



export class WebSocketClient implements IWebSocketClient {
  id: string;
  clientId?: string;
  lastPing: number;
  topics: Set<string>;
  adminUser: AdminUser;

  send: (message: string) => void;
  close: () => void;
  onMessage: (handler: (message: string) => void) => void;
  onClose: (handler: () => void) => void;

  constructor({ id, clientId, send, close, onMessage, onClose, adminUser }) {
    this.id = id;
    this.clientId = clientId;
    this.send = send;
    this.close = close;
    this.onMessage = onMessage;
    this.onClose = onClose;

    this.lastPing = Date.now();
    this.topics = new Set();
    this.adminUser = adminUser;
  }
}
