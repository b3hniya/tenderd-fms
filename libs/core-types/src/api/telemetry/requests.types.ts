export interface SaveTelemetryRequest {
  vehicleId: string;
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
  deviceId?: string;
}

export interface SaveTelemetryBatchRequest {
  telemetryData: SaveTelemetryRequest[];
}

export interface GetTelemetryHistoryRequest {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}
