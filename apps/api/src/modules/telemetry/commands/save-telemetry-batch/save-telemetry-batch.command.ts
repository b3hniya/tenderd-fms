interface TelemetryData {
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

export class SaveTelemetryBatchCommand {
  constructor(
    public readonly vehicleId: string,
    public readonly telemetryData: TelemetryData[],
    public readonly deviceId?: string
  ) {}
}
