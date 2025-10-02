/**
 * @tenderd-fms/websocket-client
 *
 * Type-safe WebSocket client for real-time communication with Tenderd FMS API
 *
 * @example
 * ```typescript
 * import { createWebSocketClient } from '@tenderd-fms/websocket-client';
 *
 * const client = createWebSocketClient('http://localhost:4000');
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

export { WebSocketClient, createWebSocketClient } from './client';

export type {
  WebSocketClientOptions,
  WebSocketEventMap,
  ConnectionState,
  ConnectionStateChange,
} from './types';

export { WEBSOCKET_EVENTS, DEFAULT_WEBSOCKET_URLS } from './constants';

export * from './utils';

export type {
  VehicleUpdateEvent,
  VehicleStatusChangeEvent,
  VehicleOfflineEvent,
  VehicleReconnectedEvent,
  MaintenanceAlertEvent,
  AlertEvent,
} from '@tenderd-fms/core-types/websocket';
