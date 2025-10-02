import { VehicleType, VehicleStatus } from "@tenderd-fms/core-types";

export class GetAllVehiclesQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly status?: VehicleStatus,
    public readonly type?: VehicleType,
    public readonly vin?: string,
    public readonly id?: string
  ) {}
}
