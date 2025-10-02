import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { GetMaintenanceByIdQuery } from "./get-maintenance-by-id.query";
import { z } from "zod";

const GetMaintenanceByIdSchema = z.object({
  id: z.string().min(1, "Maintenance ID is required"),
});

@injectable()
@Validator(GetMaintenanceByIdQuery)
export class GetMaintenanceByIdValidator implements IValidator<GetMaintenanceByIdQuery> {
  validate(query: GetMaintenanceByIdQuery): ValidationResult {
    return ZodAdapter.validate(GetMaintenanceByIdSchema, {
      id: query.id,
    });
  }
}
