import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetAllVehiclesQuery } from "./get-all-vehicles.query";
import { Vehicle } from "../../models/vehicle";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetAllVehiclesQuery)
export class GetAllVehicles implements IQueryHandler<GetAllVehiclesQuery> {
  async execute(query: GetAllVehiclesQuery): Promise<any> {
    logger.info("Getting all vehicles");

    const vehicles = await Vehicle.find();

    return vehicles;
  }
}


