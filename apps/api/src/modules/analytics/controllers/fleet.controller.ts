import { Request, Response, NextFunction } from "express";
import { Container } from "../../../infrastructure/event-source/container";
import { QueryBus } from "../../../infrastructure/event-source/query-bus";
import { GetFleetAnalyticsQuery } from "../queries/get-fleet-analytics";
import { asyncControllerWrapper } from "../../../infrastructure/utils/async-controller-wrapper";

const queryBus = Container.resolve(QueryBus);

/**
 * @swagger
 * /api/analytics/fleet:
 *   get:
 *     summary: Get fleet-wide analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics range
 *     responses:
 *       200:
 *         description: Fleet analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     fleet:
 *                       type: object
 *                       properties:
 *                         totalVehicles:
 *                           type: number
 *                         onlineVehicles:
 *                           type: number
 *                         offlineVehicles:
 *                           type: number
 *                         activeVehicles:
 *                           type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalDays:
 *                           type: number
 *                         totalDistanceTraveled:
 *                           type: number
 *                         totalHoursOperated:
 *                           type: number
 *                         totalHoursIdle:
 *                           type: number
 *                         totalFuelConsumed:
 *                           type: number
 *                         totalTrips:
 *                           type: number
 *                         averageSpeed:
 *                           type: number
 *                         maxSpeed:
 *                           type: number
 *                         averageFuelEfficiency:
 *                           type: number
 *                         averageEngineTemp:
 *                           type: number
 *                         maxEngineTemp:
 *                           type: number
 *                         overallDataQuality:
 *                           type: number
 *                         totalDataPoints:
 *                           type: number
 *                     vehicleBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           vehicleId:
 *                             type: string
 *                           distanceTraveled:
 *                             type: number
 *                           hoursOperated:
 *                             type: number
 *                           fuelConsumed:
 *                             type: number
 *                           trips:
 *                             type: number
 *                           dataQuality:
 *                             type: number
 *       400:
 *         description: Invalid request parameters
 */
export const get = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const query = new GetFleetAnalyticsQuery(
    req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    req.query.endDate ? new Date(req.query.endDate as string) : undefined
  );

  const result = await queryBus.execute(query);

  res.status(200).json({
    success: true,
    data: result,
  });
});
