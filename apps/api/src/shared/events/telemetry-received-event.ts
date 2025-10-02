export class TelemetryReceivedEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly telemetryData: {
      location: { lat: number; lng: number };
      speed: number;
      fuelLevel: number;
      odometer: number;
      engineTemp: number;
      engineRPM?: number;
      timestamp: Date;
      validation: {
        schemaValid: boolean;
        contextValid: boolean;
        issues: string[];
        severity?: string;
      };
    }
  ) {}
}
