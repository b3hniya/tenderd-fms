import { GetTelemetryHistoryQuery } from "../queries/get-telemetry-history/get-telemetry-history.query";
import { Request, Response, NextFunction } from "express";
const { queryBus } = (global as any).cqrs;

/**
 * @swagger
 * /api/telemetry/history:
 *   get:
 *     summary: Get telemetry history for a vehicle
 *     description: Retrieves historical telemetry data with optional date range
 *     tags: [Telemetry]
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *         example: "2024-01-31T23:59:59Z"
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 100
 *         description: Number of items per page (max 500)
 *     responses:
 *       200:
 *         description: Telemetry history retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, startDate, endDate, page, limit } = req.query;

    const query = new GetTelemetryHistoryQuery(
      vehicleId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      page ? parseInt(page as string) : 1,
      limit ? Math.min(parseInt(limit as string), 500) : 100 // Cap at 500
    );

    const result = await queryBus.execute(query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    next(error);
  }
};
