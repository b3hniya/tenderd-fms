'use client';
import {
  type CreateMaintenanceRequest,
  MaintenanceStatus,
  type MaintenancePart,
} from '@tenderd-fms/core-types';

export interface MaintenanceFormData extends CreateMaintenanceRequest {
  status: MaintenanceStatus;
  parts: MaintenancePart[];
  laborCost: number;
  scheduledDate: string;
  odometer: number;
}
