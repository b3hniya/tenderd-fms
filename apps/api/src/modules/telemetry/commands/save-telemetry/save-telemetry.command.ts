export class SaveTelemetryCommand {
  constructor(
    public readonly vehicleId: string,
    public readonly location: {
      lat: number;
      lng: number;
    },
    public readonly speed: number,
    public readonly fuelLevel: number,
    public readonly odometer: number,
    public readonly engineTemp: number,
    public readonly engineRPM?: number,
    public readonly timestamp?: Date,
    public readonly deviceId?: string
  ) {}
}
