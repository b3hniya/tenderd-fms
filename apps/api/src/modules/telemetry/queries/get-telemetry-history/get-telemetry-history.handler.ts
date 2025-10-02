import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetTelemetryHistoryQuery } from "./get-telemetry-history.query";
import { Telemetry } from "../../models/telemetry";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetTelemetryHistoryQuery)
export class GetTelemetryHistoryHandler implements IQueryHandler<GetTelemetryHistoryQuery> {
  async execute(query: GetTelemetryHistoryQuery): Promise<any> {
    logger.info(`Getting telemetry history for vehicle: ${query.vehicleId}`);

    const filter: any = { vehicleId: query.vehicleId };

    // Add date range filter if provided
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) {
        filter.timestamp.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.timestamp.$lte = query.endDate;
      }
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Execute query with pagination
    const [telemetryData, total] = await Promise.all([
      Telemetry.find(filter)
        .sort({ timestamp: -1 }) // Most recent first
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Telemetry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    logger.info(`Found ${telemetryData.length} telemetry records out of ${total} total`);

    return {
      data: telemetryData,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }
}
