import { VehicleType, VehicleStatus, FuelType, ConnectionStatus } from '../enums';

export interface Vehicle {
  vin: string;
  licensePlate: string;

  vehicleModel: string;
  manufacturer: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;

  status: VehicleStatus;

  currentTelemetry?: {
    location: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineTemp: number;
    timestamp: Date;
  };

  connectionStatus: ConnectionStatus;
  lastSeenAt: Date;
  offlineSince?: Date;

  createdAt: Date;
  updatedAt: Date;
}
