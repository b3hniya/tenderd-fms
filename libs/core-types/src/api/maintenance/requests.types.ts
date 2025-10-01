import { MaintenanceType, MaintenanceStatus } from '../../enums';
import { MaintenancePart } from '../../entity';

export interface CreateMaintenanceRequest {
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  scheduledAt?: Date;
  mechanicId?: string;
  mechanicName?: string;
  odometerReading?: number;
  notes?: string;
}

export interface UpdateMaintenanceRequest {
  status?: MaintenanceStatus;
  parts?: MaintenancePart[];
  laborCost?: number;
  startedAt?: Date;
  completedAt?: Date;
  mechanicId?: string;
  mechanicName?: string;
  notes?: string;
}

export interface GetMaintenanceHistoryRequest {
  vehicleId: string;
  status?: MaintenanceStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
