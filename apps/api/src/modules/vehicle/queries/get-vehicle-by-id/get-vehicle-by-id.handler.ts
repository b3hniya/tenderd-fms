import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetVehicleByIdQuery } from "./get-vehicle-by-id.query";
import { Vehicle } from "../../models/vehicle";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetVehicleByIdQuery)
export class GetVehicleById implements IQueryHandler<GetVehicleByIdQuery> {
  async execute(query: GetVehicleByIdQuery): Promise<any> {
    logger.info(`Getting vehicle by ID: ${query.vehicleId}`);

    const vehicle = await Vehicle.findOne({ vehicleId: query.vehicleId });

    if (!vehicle) {
      throw new Error(`Vehicle not found: ${query.vehicleId}`);
    }

    return vehicle;
  }
}


