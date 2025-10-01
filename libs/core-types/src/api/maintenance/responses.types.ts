import { Maintenance } from '../../entity';
import { PaginatedResponse } from '../../shared';

export interface CreateMaintenanceResponse extends Maintenance {}

export interface UpdateMaintenanceResponse extends Maintenance {}

export interface GetMaintenanceHistoryResponse extends PaginatedResponse<Maintenance> {}

export interface GetMaintenanceByIdResponse extends Maintenance {}
