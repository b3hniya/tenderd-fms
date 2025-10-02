import { injectable } from "../../../../infrastructure/event-source/container";
import { Validator, IValidator, ValidationResult, ZodAdapter } from "../../../../infrastructure/validation";
import { CreateMaintenanceRequestSchema } from "@tenderd-fms/core-types";
import { CreateMaintenanceCommand } from "./create-maintenance.command";

@injectable()
@Validator(CreateMaintenanceCommand)
export class CreateMaintenanceValidator implements IValidator<CreateMaintenanceCommand> {
  validate(command: CreateMaintenanceCommand): ValidationResult {
    return ZodAdapter.validate(CreateMaintenanceRequestSchema, {
      vehicleId: command.vehicleId,
      type: command.type,
      title: command.title,
      description: command.description,
      scheduledAt: command.scheduledAt,
      mechanicId: command.mechanicId,
      mechanicName: command.mechanicName,
      odometerReading: command.odometerReading,
      notes: command.notes,
    });
  }
}
