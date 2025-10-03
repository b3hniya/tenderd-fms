export class VehicleOfflineEvent {
  constructor(
    public readonly vehicleId: string,
    public readonly vin: string,
    public readonly lastSeenAt: Date,
    public readonly previousStatus: string
  ) {}
}
