import { MaintenanceType } from "@tenderd-fms/core-types";

export class CreateMaintenanceCommand {
  constructor(
    public readonly vehicleId: string,
    public readonly type: MaintenanceType,
    public readonly title: string,
    public readonly description?: string,
    public readonly scheduledAt?: Date,
    public readonly mechanicId?: string,
    public readonly mechanicName?: string,
    public readonly odometerReading?: number,
    public readonly notes?: string
  ) {}
}
