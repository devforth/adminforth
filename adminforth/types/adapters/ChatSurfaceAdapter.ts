import type { AdminUser } from "../Common.js";
import type { IAdminForth } from "../Back.js";

export type ChatSurfaceRequestContext = {
  body: unknown;
  headers: Record<string, unknown>;
  abortSignal: AbortSignal;
  rawRequest?: unknown;
  rawResponse?: unknown;
};

export type ChatSurfaceIncomingMessage = {
  surface: string;
  prompt: string;
  externalConversationId: string;
  externalUserId: string;
  userTimeZone?: string;
  modeName?: string | null;
  metadata?: Record<string, unknown>;
};

export type ChatSurfaceEvent =
  | {
      type: "text_delta";
      delta: string;
    }
  | {
      type: "reasoning_delta";
      delta: string;
    }
  | {
      type: "tool_call";
      event: unknown;
    }
  | {
      type: "done";
      text: string;
    }
  | {
      type: "error";
      message: string;
    };

export interface ChatSurfaceEventSink {
  emit(event: ChatSurfaceEvent): void | Promise<void>;
  close?(): void | Promise<void>;
}

export interface ChatSurfaceAdapter {
  /**
   * Stable surface identifier used in webhook URLs and session ids.
   */
  name: string;

  /**
   * Validates adapter configuration during plugin initialization.
   */
  validate(): void;

  /**
   * Converts an incoming surface webhook/request into an AdminForth Agent prompt.
   * Return null when the request is not a supported chat message.
   */
  parseIncomingMessage(
    ctx: ChatSurfaceRequestContext,
  ): ChatSurfaceIncomingMessage | null | Promise<ChatSurfaceIncomingMessage | null>;

  /**
   * Creates a response sink for sending agent events back to the external surface.
   */
  createEventSink(
    ctx: ChatSurfaceRequestContext,
    incoming: ChatSurfaceIncomingMessage,
  ): ChatSurfaceEventSink | Promise<ChatSurfaceEventSink>;

  /**
   * Maps an external surface user to an authorized AdminForth admin user.
   * Return null to reject the incoming chat message.
   */
  resolveAdminUser(input: {
    adminforth: IAdminForth;
    incoming: ChatSurfaceIncomingMessage;
  }): AdminUser | null | Promise<AdminUser | null>;
}
