/**
 * WebSocket event name constants for use in client applications
 * Prevents typos and provides autocomplete
 */

export const WEBSOCKET_EVENTS = {
  TELEMETRY_UPDATE: 'telemetry:update',
  VEHICLE_STATUS: 'vehicle:status',
  VEHICLE_OFFLINE: 'vehicle:offline',
  VEHICLE_RECONNECTED: 'vehicle:reconnected',
  MAINTENANCE_ALERT: 'maintenance:alert',
  ALERT: 'alert',

  SUBSCRIBE_VEHICLE: 'subscribe:vehicle',
  UNSUBSCRIBE_VEHICLE: 'unsubscribe:vehicle',

  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT: 'reconnect',
  RECONNECT_FAILED: 'reconnect_failed',
  RECONNECT_ERROR: 'reconnect_error',
} as const;

/**
 * Default WebSocket server URLs for different environments
 */
export const DEFAULT_WEBSOCKET_URLS = {
  development: 'http://localhost:4000',
  production: 'wss://api.tenderd.com',
  staging: 'wss://staging-api.tenderd.com',
} as const;
