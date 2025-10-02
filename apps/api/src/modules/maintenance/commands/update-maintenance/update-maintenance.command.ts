import { MaintenanceStatus } from "@tenderd-fms/core-types";

export interface MaintenancePart {
  name: string;
  quantity: number;
  cost: number;
}

export class UpdateMaintenanceCommand {
  constructor(
    public readonly id: string,
    public readonly status?: MaintenanceStatus,
    public readonly parts?: MaintenancePart[],
    public readonly laborCost?: number,
    public readonly startedAt?: Date,
    public readonly completedAt?: Date,
    public readonly mechanicId?: string,
    public readonly mechanicName?: string,
    public readonly notes?: string
  ) {}
}
