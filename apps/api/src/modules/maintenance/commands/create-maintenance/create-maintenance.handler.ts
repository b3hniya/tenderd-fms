import { injectable } from "../../../../infrastructure/event-source/container";
import { CommandHandler } from "../../../../infrastructure/decorators/command-handler";
import { ICommandHandler } from "../../../../infrastructure/event-source/command-bus";
import { CreateMaintenanceCommand } from "./create-maintenance.command";
import { Maintenance } from "../../models/maintenance";
import { Vehicle } from "../../../vehicle/models/vehicle";
import { NotFoundError } from "../../../../shared/errors/apiError";
import { MaintenanceStatus } from "@tenderd-fms/core-types";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@CommandHandler(CreateMaintenanceCommand)
export class CreateMaintenanceHandler implements ICommandHandler<CreateMaintenanceCommand> {
  async execute(command: CreateMaintenanceCommand): Promise<any> {
    logger.info(`Creating maintenance record for vehicle: ${command.vehicleId}`);

    const vehicle = await Vehicle.findById(command.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle not found: ${command.vehicleId}`);
    }

    const maintenance = await Maintenance.create({
      vehicleId: command.vehicleId,
      type: command.type,
      status: MaintenanceStatus.SCHEDULED,
      title: command.title,
      description: command.description,
      scheduledAt: command.scheduledAt,
      mechanicId: command.mechanicId,
      mechanicName: command.mechanicName,
      odometerReading: command.odometerReading,
      notes: command.notes,
    });

    logger.info(`Maintenance record created: ${maintenance._id}`);

    return maintenance;
  }
}
