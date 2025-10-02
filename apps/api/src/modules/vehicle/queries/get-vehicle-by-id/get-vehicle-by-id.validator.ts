import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { GetVehicleByIdRequestSchema } from "@tenderd-fms/core-types";
import { GetVehicleByIdQuery } from "./get-vehicle-by-id.query";

@injectable()
@Validator(GetVehicleByIdQuery)
export class GetVehicleByIdValidator implements IValidator<GetVehicleByIdQuery> {
  validate(query: GetVehicleByIdQuery): ValidationResult {
    return ZodAdapter.validate(GetVehicleByIdRequestSchema, {
      vehicleId: query.vehicleId,
    });
  }
}
