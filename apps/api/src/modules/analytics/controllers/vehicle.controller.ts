import { Request, Response, NextFunction } from "express";
import { Container } from "../../../infrastructure/event-source/container";
import { QueryBus } from "../../../infrastructure/event-source/query-bus";
import { GetVehicleAnalyticsQuery } from "../queries/get-vehicle-analytics";
import { asyncControllerWrapper } from "../../../infrastructure/utils/async-controller-wrapper";

const queryBus = Container.resolve(QueryBus);

/**
 * @swagger
 * /api/analytics/vehicle:
 *   get:
 *     summary: Get analytics for a specific vehicle
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
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
 *         description: Vehicle analytics retrieved successfully
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
 *                     vehicleId:
 *                       type: string
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vin:
 *                           type: string
 *                         licensePlate:
 *                           type: string
 *                         vehicleModel:
 *                           type: string
 *                         manufacturer:
 *                           type: string
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
 *                     dailyData:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Vehicle not found
 */
export const get = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const query = new GetVehicleAnalyticsQuery(
    req.query.vehicleId as string,
    req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    req.query.endDate ? new Date(req.query.endDate as string) : undefined
  );

  const result = await queryBus.execute(query);

  res.status(200).json({
    success: true,
    data: result,
  });
});
