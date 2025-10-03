export class VehicleReconnectedEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly vin: string,
    public readonly reconnectedAt: Date,
    public readonly offlineDuration: number // in milliseconds
  ) {}
}
