import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { GetAllVehiclesRequestSchema } from "@tenderd-fms/core-types";
import { GetAllVehiclesQuery } from "./get-all-vehicles.query";

@injectable()
@Validator(GetAllVehiclesQuery)
export class GetAllVehiclesValidator implements IValidator<GetAllVehiclesQuery> {
  validate(query: GetAllVehiclesQuery): ValidationResult {
    return ZodAdapter.validate(GetAllVehiclesRequestSchema, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      type: query.type,
    });
  }
}
