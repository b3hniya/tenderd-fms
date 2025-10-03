import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetAllVehiclesQuery } from "./get-all-vehicles.query";
import { Vehicle } from "../../models/vehicle";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetAllVehiclesQuery)
export class GetAllVehiclesHandler implements IQueryHandler<GetAllVehiclesQuery> {
  async execute(query: GetAllVehiclesQuery): Promise<any> {
    logger.info("Getting all vehicles with filters");

    const filter: any = {};

    if (query.vin) {
      filter.vin = query.vin.toUpperCase();
    }

    if (query.id) {
      filter._id = query.id;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const skip = (query.page - 1) * query.limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).skip(skip).limit(query.limit).sort({ createdAt: -1 }).lean(),
      Vehicle.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    logger.info(`Found ${vehicles.length} vehicles out of ${total} total`);

    const transformedVehicles = vehicles.map((v: any) => {
      if (v.currentTelemetry?.location?.coordinates) {
        const [lng, lat] = v.currentTelemetry.location.coordinates;
        return {
          ...v,
          currentTelemetry: {
            ...v.currentTelemetry,
            location: { lat, lng },
          },
        };
      }
      return v;
    });

    return {
      data: transformedVehicles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }
}
