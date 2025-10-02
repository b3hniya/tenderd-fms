/**
 * WebSocket connection states
 */
export enum ConnectionState {
  /**
   * Not connected, no connection attempt in progress
   */
  DISCONNECTED = 'DISCONNECTED',

  /**
   * Attempting to establish connection
   */
  CONNECTING = 'CONNECTING',

  /**
   * Successfully connected
   */
  CONNECTED = 'CONNECTED',

  /**
   * Disconnected and attempting to reconnect
   */
  RECONNECTING = 'RECONNECTING',

  /**
   * Connection failed after all retry attempts
   */
  FAILED = 'FAILED',
}

/**
 * Connection state change event
 */
export interface ConnectionStateChange {
  previousState: ConnectionState;
  currentState: ConnectionState;
  timestamp: Date;
  reason?: string;
}
