/**
 * Type-safe WebSocket client for Tenderd FMS
 * Built on top of Socket.IO client
 */

import { io, Socket } from 'socket.io-client';
import type { WebSocketClientOptions, WebSocketEventMap, ConnectionStateChange } from './types';
import { DEFAULT_CLIENT_OPTIONS, ConnectionState } from './types';

/**
 * Event handler type for type-safe event listeners
 */
type EventHandler<T> = (data: T) => void | Promise<void>;

/**
 * WebSocket client with full type safety for Tenderd FMS events
 *
 * @example
 * ```typescript
 * const client = new WebSocketClient({ url: 'http://localhost:4000' });
 *
 * client.on('telemetry:update', (data) => {
 *   console.log(`Vehicle ${data.vehicleId} at ${data.telemetry.speed} km/h`);
 * });
 *
 * client.on('vehicle:offline', (data) => {
 *   alert(`Vehicle ${data.vin} went offline!`);
 * });
 * ```
 */
export class WebSocketClient {
  private socket: Socket;
  private _connectionState: ConnectionState;
  private _isConnected = false;
  private stateChangeHandlers: Set<EventHandler<ConnectionStateChange>> = new Set();

  constructor(options: WebSocketClientOptions) {
    const config = { ...DEFAULT_CLIENT_OPTIONS, ...options };

    this.socket = io(options.url, {
      transports: config.transports,
      reconnection: config.reconnection,
      reconnectionAttempts: config.reconnectionAttempts,
      reconnectionDelay: config.reconnectionDelay,
      reconnectionDelayMax: config.reconnectionDelayMax,
      timeout: config.timeout,
      auth: config.auth,
    });

    this._connectionState = ConnectionState.DISCONNECTED;
    this.setupInternalHandlers();
  }

  /**
   * Setup internal connection lifecycle handlers
   */
  private setupInternalHandlers(): void {
    this.socket.on('connect', () => {
      this._isConnected = true;
      this.updateConnectionState(ConnectionState.CONNECTED);
    });

    this.socket.on('disconnect', reason => {
      this._isConnected = false;
      this.updateConnectionState(ConnectionState.DISCONNECTED, reason);
    });

    this.socket.on('connect_error', () => {
      this.updateConnectionState(ConnectionState.CONNECTING);
    });

    this.socket.on('reconnect_attempt', () => {
      this.updateConnectionState(ConnectionState.RECONNECTING);
    });

    this.socket.on('reconnect_failed', () => {
      this.updateConnectionState(ConnectionState.FAILED, 'Max reconnection attempts reached');
    });
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(newState: ConnectionState, reason?: string): void {
    const previousState = this._connectionState;
    this._connectionState = newState;

    const change: ConnectionStateChange = {
      previousState,
      currentState: newState,
      timestamp: new Date(),
      reason,
    };

    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(change);
      } catch (error) {
        console.error('Error in connection state change handler:', error);
      }
    });
  }

  /**
   * Register a type-safe event listener
   *
   * @example
   * ```typescript
   * client.on('telemetry:update', (data) => {
   *   // data is fully typed as VehicleUpdateEvent
   *   console.log(data.vehicleId, data.telemetry.speed);
   * });
   * ```
   */
  on<K extends keyof WebSocketEventMap>(
    event: K,
    handler: EventHandler<WebSocketEventMap[K]>,
  ): this {
    this.socket.on(event as string, handler as any);
    return this;
  }

  /**
   * Register a one-time event listener (fires once then removes itself)
   */
  once<K extends keyof WebSocketEventMap>(
    event: K,
    handler: EventHandler<WebSocketEventMap[K]>,
  ): this {
    this.socket.once(event as string, handler as any);
    return this;
  }

  /**
   * Remove an event listener
   *
   * @example
   * ```typescript
   * const handler = (data) => console.log(data);
   * client.on('telemetry:update', handler);
   * // Later...
   * client.off('telemetry:update', handler);
   * ```
   */
  off<K extends keyof WebSocketEventMap>(
    event: K,
    handler?: EventHandler<WebSocketEventMap[K]>,
  ): this {
    if (handler) {
      this.socket.off(event as string, handler as any);
    } else {
      this.socket.off(event as string);
    }
    return this;
  }

  /**
   * Emit an event to the server
   *
   * @example
   * ```typescript
   * client.emit('subscribe:vehicle', { vehicleId: '507f1f77bcf86cd799439011' });
   * ```
   */
  emit<K extends keyof WebSocketEventMap>(event: K, data: WebSocketEventMap[K]): this {
    this.socket.emit(event as string, data);
    return this;
  }

  /**
   * Subscribe to updates for a specific vehicle
   *
   * @example
   * ```typescript
   * client.subscribeToVehicle('507f1f77bcf86cd799439011');
   * ```
   */
  subscribeToVehicle(vehicleId: string): this {
    this.socket.emit('subscribe:vehicle', { vehicleId });
    return this;
  }

  /**
   * Subscribe to updates for multiple vehicles
   */
  subscribeToVehicles(vehicleIds: string[]): this {
    this.socket.emit('subscribe:vehicle', { vehicleIds });
    return this;
  }

  /**
   * Unsubscribe from a specific vehicle's updates
   */
  unsubscribeFromVehicle(vehicleId: string): this {
    this.socket.emit('unsubscribe:vehicle', { vehicleId });
    return this;
  }

  /**
   * Unsubscribe from multiple vehicles
   */
  unsubscribeFromVehicles(vehicleIds: string[]): this {
    this.socket.emit('unsubscribe:vehicle', { vehicleIds });
    return this;
  }

  /**
   * Register a handler for connection state changes
   *
   * @example
   * ```typescript
   * client.onConnectionStateChange((change) => {
   *   console.log(`State: ${change.previousState} → ${change.currentState}`);
   * });
   * ```
   */
  onConnectionStateChange(handler: EventHandler<ConnectionStateChange>): () => void {
    this.stateChangeHandlers.add(handler);

    // Return cleanup function
    return () => {
      this.stateChangeHandlers.delete(handler);
    };
  }

  /**
   * Check if the client is currently connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get current connection state
   */
  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  /**
   * Get the underlying Socket.IO socket ID (available after connection)
   */
  get socketId(): string | undefined {
    return this.socket.id;
  }

  /**
   * Manually disconnect from the server
   *
   * @example
   * ```typescript
   * client.disconnect();
   * ```
   */
  disconnect(): this {
    this.socket.disconnect();
    return this;
  }

  /**
   * Manually reconnect to the server
   */
  connect(): this {
    this.socket.connect();
    return this;
  }

  /**
   * Remove all event listeners and disconnect
   * Call this when you're done with the client (e.g., component unmount)
   *
   * @example
   * ```typescript
   * useEffect(() => {
   *   const client = new WebSocketClient({ url: '...' });
   *   return () => client.destroy();
   * }, []);
   * ```
   */
  destroy(): void {
    this.socket.removeAllListeners();
    this.stateChangeHandlers.clear();
    this.socket.disconnect();
  }

  /**
   * Get the count of registered listeners for an event (useful for debugging)
   */
  listenerCount(event: keyof WebSocketEventMap): number {
    // Socket.IO v4 doesn't expose listenerCount directly
    // We can get it from the EventEmitter
    return (this.socket as any).listeners(event as string).length;
  }
}

/**
 * Factory function to create a WebSocket client
 * Convenience alternative to `new WebSocketClient()`
 *
 * @example
 * ```typescript
 * const client = createWebSocketClient('http://localhost:4000');
 * ```
 */
export function createWebSocketClient(
  url: string,
  options?: Partial<Omit<WebSocketClientOptions, 'url'>>,
): WebSocketClient {
  return new WebSocketClient({ url, ...options });
}
