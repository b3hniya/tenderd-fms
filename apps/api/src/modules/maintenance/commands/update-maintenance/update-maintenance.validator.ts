import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { UpdateMaintenanceRequestSchema } from "@tenderd-fms/core-types";
import { UpdateMaintenanceCommand } from "./update-maintenance.command";
import { z } from "zod";

const UpdateMaintenanceWithIdSchema = UpdateMaintenanceRequestSchema.extend({
  id: z.string().min(1, "Maintenance ID is required"),
});

@injectable()
@Validator(UpdateMaintenanceCommand)
export class UpdateMaintenanceValidator implements IValidator<UpdateMaintenanceCommand> {
  validate(command: UpdateMaintenanceCommand): ValidationResult {
    return ZodAdapter.validate(UpdateMaintenanceWithIdSchema, {
      id: command.id,
      status: command.status,
      parts: command.parts,
      laborCost: command.laborCost,
      startedAt: command.startedAt,
      completedAt: command.completedAt,
      mechanicId: command.mechanicId,
      mechanicName: command.mechanicName,
      notes: command.notes,
    });
  }
}
