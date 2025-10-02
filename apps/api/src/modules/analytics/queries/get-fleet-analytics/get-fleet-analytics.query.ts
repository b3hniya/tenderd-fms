export class GetFleetAnalyticsQuery {
  constructor(
    public readonly startDate?: Date,
    public readonly endDate?: Date
  ) {}
}
