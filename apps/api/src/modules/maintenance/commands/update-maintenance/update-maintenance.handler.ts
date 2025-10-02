import { injectable } from "../../../../infrastructure/event-source/container";
import { CommandHandler } from "../../../../infrastructure/decorators/command-handler";
import { ICommandHandler } from "../../../../infrastructure/event-source/command-bus";
import { UpdateMaintenanceCommand } from "./update-maintenance.command";
import { Maintenance } from "../../models/maintenance";
import { NotFoundError } from "../../../../shared/errors/apiError";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@CommandHandler(UpdateMaintenanceCommand)
export class UpdateMaintenanceHandler implements ICommandHandler<UpdateMaintenanceCommand> {
  async execute(command: UpdateMaintenanceCommand): Promise<any> {
    logger.info(`Updating maintenance record: ${command.id}`);

    const maintenance = await Maintenance.findById(command.id);
    if (!maintenance) {
      throw new NotFoundError(`Maintenance record not found: ${command.id}`);
    }

    if (command.status !== undefined) {
      maintenance.status = command.status;
    }

    if (command.parts !== undefined) {
      maintenance.parts = command.parts;
    }

    if (command.laborCost !== undefined) {
      maintenance.laborCost = command.laborCost;
    }

    if (command.startedAt !== undefined) {
      maintenance.startedAt = command.startedAt;
    }

    if (command.completedAt !== undefined) {
      maintenance.completedAt = command.completedAt;
    }

    if (command.mechanicId !== undefined) {
      maintenance.mechanicId = command.mechanicId;
    }

    if (command.mechanicName !== undefined) {
      maintenance.mechanicName = command.mechanicName;
    }

    if (command.notes !== undefined) {
      maintenance.notes = command.notes;
    }

    await maintenance.save();

    logger.info(
      `Maintenance record updated: ${maintenance._id}, Status: ${maintenance.status}, Total Cost: ${maintenance.totalCost}`
    );

    return maintenance;
  }
}
