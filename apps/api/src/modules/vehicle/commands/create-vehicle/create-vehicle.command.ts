import { VehicleType, VehicleStatus, FuelType } from "@tenderd-fms/core-types";

export class CreateVehicleCommand {
  constructor(
    public readonly vin: string,
    public readonly licensePlate: string,
    public readonly vehicleModel: string,
    public readonly manufacturer: string,
    public readonly year: number,
    public readonly type: VehicleType,
    public readonly fuelType: FuelType,
    public readonly status: VehicleStatus = VehicleStatus.ACTIVE
  ) {}
}
