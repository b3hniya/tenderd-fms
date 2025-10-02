export class GetVehicleAnalyticsQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date
  ) {}
}
