import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetMaintenanceHistoryQuery } from "./get-maintenance-history.query";
import { Maintenance } from "../../models/maintenance";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetMaintenanceHistoryQuery)
export class GetMaintenanceHistoryHandler implements IQueryHandler<GetMaintenanceHistoryQuery> {
  async execute(query: GetMaintenanceHistoryQuery): Promise<any> {
    logger.info(`Fetching maintenance history for vehicle: ${query.vehicleId}`);

    const filter: any = {
      vehicleId: query.vehicleId,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      Maintenance.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      Maintenance.countDocuments(filter),
    ]);

    logger.info(`Found ${data.length} maintenance records for vehicle ${query.vehicleId}`);

    return {
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
