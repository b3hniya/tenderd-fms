export enum VehicleType {
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum FuelType {
  ELECTRIC = 'ELECTRIC',
  DIESEL = 'DIESEL',
  GASOLINE = 'GASOLINE',
  HYBRID = 'HYBRID',
}

export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  STALE = 'STALE',
  OFFLINE = 'OFFLINE',
}

export enum MaintenanceType {
  SCHEDULED = 'SCHEDULED',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ValidationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RejectionReason {
  SCHEMA_INVALID = 'SCHEMA_INVALID',
  CONTEXT_INVALID = 'CONTEXT_INVALID',
  DUPLICATE = 'DUPLICATE',
}
