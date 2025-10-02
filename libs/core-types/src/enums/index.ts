export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  BUS = 'BUS',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  CNG = 'CNG',
  LPG = 'LPG',
  OTHER = 'OTHER',
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
