export class GetTelemetryHistoryQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 100
  ) {}
}
