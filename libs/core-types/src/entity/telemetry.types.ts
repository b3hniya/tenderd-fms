import { ValidationSeverity } from '../enums';

export interface Telemetry {
  vehicleId: string;

  timestamp: Date;

  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  speed: number;
  fuelLevel: number;
  odometer: number;
  engineTemp: number;
  engineRPM?: number;

  validation: {
    schemaValid: boolean;
    contextValid: boolean;
    issues: string[];
    severity?: ValidationSeverity;
  };

  deviceId?: string;
  receivedAt: Date;
}

export interface ValidationLog {
  vehicleId: string;
  timestamp: Date;

  rawData: any;

  validationErrors: {
    field: string;
    message: string;
    value: any;
  }[];

  rejectionReason: 'SCHEMA_INVALID' | 'CONTEXT_INVALID' | 'DUPLICATE';
  severity: ValidationSeverity;

  createdAt: Date;
}
