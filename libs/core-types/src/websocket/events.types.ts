import { Vehicle, Telemetry } from '../entity';
import { ConnectionStatus } from '../enums';

export interface VehicleUpdateEvent {
  vehicleId: string;
  telemetry: Telemetry;
}

export interface VehicleStatusChangeEvent {
  vehicleId: string;
  oldStatus: ConnectionStatus;
  newStatus: ConnectionStatus;
  timestamp: Date;
}

export interface VehicleOfflineEvent {
  vehicleId: string;
  lastSeenAt: Date;
  offlineDuration: number; // milliseconds
}

export interface VehicleReconnectedEvent {
  vehicleId: string;
  offlineDuration: number; // milliseconds
  bufferedDataPoints?: number;
}

export interface MaintenanceAlertEvent {
  vehicleId: string;
  maintenanceId: string;
  type: 'SCHEDULED' | 'OVERDUE' | 'COMPLETED';
  message: string;
}

export interface AlertEvent {
  vehicleId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  timestamp: Date;
}

// Client -> Server Events
export interface SubscribeToVehicleRequest {
  vehicleId: string;
}

export interface UnsubscribeFromVehicleRequest {
  vehicleId: string;
}

// Server -> Client Events
export type WebSocketEvent =
  | { type: 'vehicle-update'; data: VehicleUpdateEvent }
  | { type: 'vehicle-status-change'; data: VehicleStatusChangeEvent }
  | { type: 'vehicle-offline'; data: VehicleOfflineEvent }
  | { type: 'vehicle-reconnected'; data: VehicleReconnectedEvent }
  | { type: 'maintenance-alert'; data: MaintenanceAlertEvent }
  | { type: 'alert'; data: AlertEvent };
