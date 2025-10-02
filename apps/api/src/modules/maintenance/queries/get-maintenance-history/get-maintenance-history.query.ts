import { MaintenanceStatus } from "@tenderd-fms/core-types";

export class GetMaintenanceHistoryQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly status?: MaintenanceStatus,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {}
}
