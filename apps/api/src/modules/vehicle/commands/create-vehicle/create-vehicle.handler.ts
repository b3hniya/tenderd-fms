import { injectable } from "../../../../infrastructure/event-source/container";
import { CommandHandler } from "../../../../infrastructure/decorators/command-handler";
import { ICommandHandler } from "../../../../infrastructure/event-source/command-bus";
import { CreateVehicleCommand } from "./create-vehicle.command";
import { Vehicle } from "../../models/vehicle";
import logger from "../../../../infrastructure/configs/logger";
import mongoose from "mongoose";

@injectable()
@CommandHandler(CreateVehicleCommand)
export class CreateVehicleHandler implements ICommandHandler<CreateVehicleCommand> {
  async execute(command: CreateVehicleCommand): Promise<any> {
    logger.info(`Creating vehicle with VIN: ${command.vin}`);

    const vehicleId = new mongoose.Types.ObjectId().toString();

    const vehicle = await Vehicle.create({
      _id: vehicleId,
      vin: command.vin,
      licensePlate: command.licensePlate,
      vehicleModel: command.vehicleModel,
      manufacturer: command.manufacturer,
      year: command.year,
      type: command.type,
      fuelType: command.fuelType,
      status: command.status,
      connectionStatus: "OFFLINE", // Default to offline until first telemetry
      lastSeenAt: new Date(),
    });

    logger.info(`Vehicle created successfully: ${vehicle.vin}`);

    return vehicle;
  }
}
