/**
 * Configuration options for WebSocket client connection
 */
export interface WebSocketClientOptions {
  /**
   * WebSocket server URL (e.g., 'http://localhost:4000' or 'wss://api.tenderd.com')
   */
  url: string;

  /**
   * Enable automatic reconnection on disconnect
   * @default true
   */
  reconnection?: boolean;

  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  reconnectionAttempts?: number;

  /**
   * Initial delay between reconnection attempts in milliseconds
   * @default 1000
   */
  reconnectionDelay?: number;

  /**
   * Maximum delay between reconnection attempts in milliseconds
   * @default 5000
   */
  reconnectionDelayMax?: number;

  /**
   * Connection timeout in milliseconds
   * @default 20000
   */
  timeout?: number;

  /**
   * Transport methods to use
   * @default ['websocket']
   */
  transports?: ('websocket' | 'polling')[];

  /**
   * Authentication token (optional, for future use)
   */
  auth?: {
    token?: string;
  };
}

/**
 * Default options for WebSocket client
 */
export const DEFAULT_CLIENT_OPTIONS: Partial<WebSocketClientOptions> = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket'],
};
