import { Vehicle } from '../../entity';
import { PaginatedResponse } from '../../shared';

export interface CreateVehicleResponse extends Vehicle {}

export interface GetVehicleByIdResponse extends Vehicle {}

export interface GetAllVehiclesResponse extends PaginatedResponse<Vehicle> {}

export interface UpdateVehicleResponse extends Vehicle {}
