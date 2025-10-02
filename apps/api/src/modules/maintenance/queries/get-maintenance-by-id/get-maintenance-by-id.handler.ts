import { injectable } from "../../../../infrastructure/event-source/container";
import { QueryHandler } from "../../../../infrastructure/decorators/query-handler";
import { IQueryHandler } from "../../../../infrastructure/event-source/query-bus";
import { GetMaintenanceByIdQuery } from "./get-maintenance-by-id.query";
import { Maintenance } from "../../models/maintenance";
import { NotFoundError } from "../../../../shared/errors/apiError";
import logger from "../../../../infrastructure/configs/logger";

@injectable()
@QueryHandler(GetMaintenanceByIdQuery)
export class GetMaintenanceByIdHandler implements IQueryHandler<GetMaintenanceByIdQuery> {
  async execute(query: GetMaintenanceByIdQuery): Promise<any> {
    logger.info(`Fetching maintenance record: ${query.id}`);

    const maintenance = await Maintenance.findById(query.id).lean();

    if (!maintenance) {
      throw new NotFoundError(`Maintenance record not found: ${query.id}`);
    }

    logger.info(`Maintenance record found: ${query.id}`);

    return maintenance;
  }
}
