/**
 * WebSocket event type mappings
 * Re-exports event types from @core-types and adds internal events
 */

import type {
  VehicleUpdateEvent,
  VehicleStatusChangeEvent,
  VehicleOfflineEvent,
  VehicleReconnectedEvent,
  MaintenanceAlertEvent,
  AlertEvent,
} from '@tenderd-fms/core-types/websocket';

/**
 * Complete event map for type-safe WebSocket communication
 */
export interface WebSocketEventMap {
  // ===== Server → Client Events =====

  /**
   * Real-time telemetry updates (emitted every ~30s per vehicle)
   */
  'telemetry:update': VehicleUpdateEvent;

  /**
   * Vehicle connection status changes (online/offline/stale)
   */
  'vehicle:status': VehicleStatusChangeEvent;

  /**
   * Vehicle went offline (5+ minutes without telemetry)
   */
  'vehicle:offline': VehicleOfflineEvent;

  /**
   * Vehicle reconnected after being offline
   */
  'vehicle:reconnected': VehicleReconnectedEvent;

  /**
   * Maintenance alerts (due, overdue, critical)
   */
  'maintenance:alert': MaintenanceAlertEvent;

  /**
   * General system alerts
   */
  alert: AlertEvent;

  // ===== Client → Server Events =====

  /**
   * Subscribe to updates for specific vehicle(s)
   */
  'subscribe:vehicle': {
    vehicleId?: string;
    vehicleIds?: string[];
  };

  /**
   * Unsubscribe from vehicle updates
   */
  'unsubscribe:vehicle': {
    vehicleId?: string;
    vehicleIds?: string[];
  };

  // ===== Internal Connection Events =====

  /**
   * Socket connected successfully
   */
  connect: void;

  /**
   * Socket disconnected
   */
  disconnect: string; // Reason

  /**
   * Connection error occurred
   */
  connect_error: Error;

  /**
   * Attempting to reconnect
   */
  reconnect_attempt: number; // Attempt number

  /**
   * Successfully reconnected
   */
  reconnect: number; // Attempt number

  /**
   * Failed to reconnect after all attempts
   */
  reconnect_failed: void;

  /**
   * Reconnection error
   */
  reconnect_error: Error;
}

/**
 * Event names as string literals for type safety
 */
export const EVENT_NAMES = {
  // Server → Client
  TELEMETRY_UPDATE: 'telemetry:update',
  VEHICLE_STATUS: 'vehicle:status',
  VEHICLE_OFFLINE: 'vehicle:offline',
  VEHICLE_RECONNECTED: 'vehicle:reconnected',
  MAINTENANCE_ALERT: 'maintenance:alert',
  ALERT: 'alert',

  // Client → Server
  SUBSCRIBE_VEHICLE: 'subscribe:vehicle',
  UNSUBSCRIBE_VEHICLE: 'unsubscribe:vehicle',

  // Internal
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT: 'reconnect',
  RECONNECT_FAILED: 'reconnect_failed',
  RECONNECT_ERROR: 'reconnect_error',
} as const;
