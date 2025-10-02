import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { CreateVehicleRequestSchema } from "@tenderd-fms/core-types";
import { CreateVehicleCommand } from "./create-vehicle.command";

@injectable()
@Validator(CreateVehicleCommand)
export class CreateVehicleValidator implements IValidator<CreateVehicleCommand> {
  validate(command: CreateVehicleCommand): ValidationResult {
    return ZodAdapter.validate(CreateVehicleRequestSchema, {
      vin: command.vin,
      licensePlate: command.licensePlate,
      vehicleModel: command.vehicleModel,
      manufacturer: command.manufacturer,
      year: command.year,
      type: command.type,
      fuelType: command.fuelType,
      status: command.status,
    });
  }
}
