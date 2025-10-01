export class TelemetryReceivedEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly telemetryData: {
      location: { lat: number; lng: number };
      speed: number;
      fuelLevel?: number;
      engineTemp?: number;
      timestamp: Date;
    }
  ) {}
}


