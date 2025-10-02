/**
 * Telemetry data structure matching the API contract
 */
export interface TelemetryData {
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  fuelLevel: number;
  odometer: number;
  engineTemp: number;
  engineRPM?: number;
  timestamp: Date;
}

/**
 * Telemetry payload with vehicle ID (for batch transmission)
 */
export interface TelemetryPayload extends TelemetryData {
  vehicleId: string;
  deviceId?: string;
}
