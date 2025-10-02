/**
 * Mock WebSocket client for testing
 * Simulates WebSocket behavior without actual network connection
 */

import type { WebSocketEventMap, ConnectionState } from '../types';
import { TypedEventEmitter } from '../utils/event-emitter';

type EventHandler<T> = (data: T) => void | Promise<void>;

/**
 * Mock WebSocket client for testing React components and hooks
 *
 * @example
 * ```typescript
 * const mockClient = new MockWebSocketClient();
 *
 * // Register handler
 * mockClient.on('telemetry:update', (data) => {
 *   console.log('Received:', data);
 * });
 *
 * // Simulate event from server
 * mockClient.simulateEvent('telemetry:update', {
 *   vehicleId: '123',
 *   telemetry: { ... }
 * });
 * ```
 */
export class MockWebSocketClient {
  private emitter = new TypedEventEmitter<WebSocketEventMap>();
  private _isConnected = false;
  private _connectionState: ConnectionState = 'DISCONNECTED' as ConnectionState;
  private eventQueue: Array<{ event: string; data: any; delay: number }> = [];
  private processingQueue = false;

  constructor(options?: { autoConnect?: boolean }) {
    if (options?.autoConnect) {
      setTimeout(() => this.simulateConnect(), 0);
    }
  }

  /**
   * Simulate a server event
   */
  async simulateEvent<K extends keyof WebSocketEventMap>(
    event: K,
    data: WebSocketEventMap[K],
    delay = 0,
  ): Promise<void> {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await this.emitter.emit(event, data);
  }

  /**
   * Queue multiple events to be fired sequentially
   */
  queueEvents(events: Array<{ event: keyof WebSocketEventMap; data: any; delay?: number }>): void {
    this.eventQueue.push(...events.map(e => ({ ...e, delay: e.delay ?? 0 })));
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process queued events
   */
  private async processQueue(): Promise<void> {
    this.processingQueue = true;

    while (this.eventQueue.length > 0) {
      const { event, data, delay } = this.eventQueue.shift()!;
      await this.simulateEvent(event as keyof WebSocketEventMap, data, delay);
    }

    this.processingQueue = false;
  }

  /**
   * Simulate connection
   */
  simulateConnect(): void {
    this._isConnected = true;
    this._connectionState = 'CONNECTED' as ConnectionState;
    this.emitter.emit('connect', undefined as any);
  }

  /**
   * Simulate disconnection
   */
  simulateDisconnect(reason = 'manual'): void {
    this._isConnected = false;
    this._connectionState = 'DISCONNECTED' as ConnectionState;
    this.emitter.emit('disconnect', reason as any);
  }

  /**
   * Simulate connection error
   */
  simulateConnectionError(error: Error = new Error('Connection failed')): void {
    this._connectionState = 'CONNECTING' as ConnectionState;
    this.emitter.emit('connect_error', error as any);
  }

  /**
   * Simulate reconnection attempts
   */
  async simulateReconnectionFlow(attempts = 3, delayBetweenAttempts = 1000): Promise<void> {
    this.simulateDisconnect('transport close');

    for (let i = 1; i <= attempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
      this._connectionState = 'RECONNECTING' as ConnectionState;
      await this.emitter.emit('reconnect_attempt', i as any);

      if (i === attempts) {
        // Last attempt succeeds
        this.simulateConnect();
        await this.emitter.emit('reconnect', i as any);
      }
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof WebSocketEventMap>(
    event: K,
    handler: EventHandler<WebSocketEventMap[K]>,
  ): this {
    this.emitter.on(event, handler);
    return this;
  }

  /**
   * Register one-time event handler
   */
  once<K extends keyof WebSocketEventMap>(
    event: K,
    handler: EventHandler<WebSocketEventMap[K]>,
  ): this {
    this.emitter.once(event, handler);
    return this;
  }

  /**
   * Remove event handler
   */
  off<K extends keyof WebSocketEventMap>(
    event: K,
    handler?: EventHandler<WebSocketEventMap[K]>,
  ): this {
    this.emitter.off(event, handler);
    return this;
  }

  /**
   * Emit event to server (mock - just logs)
   */
  emit<K extends keyof WebSocketEventMap>(event: K, data: WebSocketEventMap[K]): this {
    console.log(`[MockWebSocket] Client emitted: ${String(event)}`, data);
    return this;
  }

  /**
   * Subscribe to vehicle (mock)
   */
  subscribeToVehicle(vehicleId: string): this {
    console.log(`[MockWebSocket] Subscribed to vehicle: ${vehicleId}`);
    return this;
  }

  /**
   * Unsubscribe from vehicle (mock)
   */
  unsubscribeFromVehicle(vehicleId: string): this {
    console.log(`[MockWebSocket] Unsubscribed from vehicle: ${vehicleId}`);
    return this;
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get connection state
   */
  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  /**
   * Mock socket ID
   */
  get socketId(): string {
    return 'mock-socket-id-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Disconnect (mock)
   */
  disconnect(): this {
    this.simulateDisconnect('manual');
    return this;
  }

  /**
   * Connect (mock)
   */
  connect(): this {
    this.simulateConnect();
    return this;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.emitter.removeAllListeners();
    this.eventQueue = [];
    this._isConnected = false;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof WebSocketEventMap): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Clear all queued events
   */
  clearQueue(): void {
    this.eventQueue = [];
  }
}

/**
 * Factory function to create a mock WebSocket client
 */
export function createMockWebSocketClient(options?: {
  autoConnect?: boolean;
}): MockWebSocketClient {
  return new MockWebSocketClient(options);
}

/**
 * Helper to create mock telemetry data
 */
export function createMockTelemetryEvent(overrides?: Partial<any>): any {
  return {
    vehicleId: '507f1f77bcf86cd799439011',
    telemetry: {
      location: { lat: 25.2048, lng: 55.2708 },
      speed: 65,
      fuelLevel: 78,
      odometer: 125000,
      engineTemp: 85,
      engineRPM: 2500,
      timestamp: new Date().toISOString(),
      validation: {
        schemaValid: true,
        contextValid: true,
        issues: [],
        severity: 'INFO',
      },
    },
    ...overrides,
  };
}

/**
 * Helper to create mock vehicle offline event
 */
export function createMockVehicleOfflineEvent(overrides?: Partial<any>): any {
  return {
    vehicleId: '507f1f77bcf86cd799439011',
    vin: '1HGBH41JXMN109186',
    offlineSince: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastKnownLocation: { lat: 25.2048, lng: 55.2708 },
    ...overrides,
  };
}

/**
 * Helper to create mock vehicle reconnected event
 */
export function createMockVehicleReconnectedEvent(overrides?: Partial<any>): any {
  return {
    vehicleId: '507f1f77bcf86cd799439011',
    vin: '1HGBH41JXMN109186',
    offlineDuration: 1200000, // 20 minutes
    bufferedDataPoints: 40,
    ...overrides,
  };
}
