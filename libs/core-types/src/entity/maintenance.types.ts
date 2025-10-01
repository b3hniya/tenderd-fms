import { MaintenanceType, MaintenanceStatus } from '../enums';

export interface MaintenancePart {
  name: string;
  quantity: number;
  cost: number;
}

export interface Maintenance {
  vehicleId: string;

  type: MaintenanceType;
  status: MaintenanceStatus;

  title: string;
  description?: string;

  parts?: MaintenancePart[];
  laborCost?: number;
  totalCost?: number;

  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  mechanicId?: string;
  mechanicName?: string;

  odometerReading?: number;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}
