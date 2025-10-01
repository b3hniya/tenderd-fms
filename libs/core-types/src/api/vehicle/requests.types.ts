import { VehicleType, VehicleStatus, FuelType } from '../../enums';

export interface CreateVehicleRequest {
  vin: string;
  licensePlate: string;
  vehicleModel: string;
  manufacturer: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;
  status?: VehicleStatus;
}

export interface UpdateVehicleRequest {
  vehicleModel?: string;
  manufacturer?: string;
  year?: number;
  type?: VehicleType;
  fuelType?: FuelType;
  status?: VehicleStatus;
}

export interface GetVehicleByIdRequest {
  vehicleId: string;
}

export interface GetAllVehiclesRequest {
  page?: number;
  limit?: number;
  status?: VehicleStatus;
  type?: VehicleType;
}
