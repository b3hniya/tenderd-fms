import { Request, Response, NextFunction } from "express";
import { Container } from "../../../infrastructure/event-source/container";
import { QueryBus } from "../../../infrastructure/event-source/query-bus";
import { GetMaintenanceHistoryQuery } from "../queries/get-maintenance-history";
import { asyncControllerWrapper } from "../../../infrastructure/utils/async-controller-wrapper";

const queryBus = Container.resolve(QueryBus);

/**
 * @swagger
 * /api/maintenance/vehicle:
 *   get:
 *     summary: Get maintenance history for a vehicle
 *     tags: [Maintenance]
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Maintenance history retrieved successfully
 *       400:
 *         description: Invalid request parameters
 */
export const get = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const query = new GetMaintenanceHistoryQuery(
    req.query.vehicleId as string,
    req.query.status as any,
    req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    req.query.page ? parseInt(req.query.page as string) : 1,
    req.query.limit ? parseInt(req.query.limit as string) : 10
  );

  const result = await queryBus.execute(query);

  res.status(200).json({
    success: true,
    ...result,
  });
});
