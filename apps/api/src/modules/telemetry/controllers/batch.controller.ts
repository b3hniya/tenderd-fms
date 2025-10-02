import { Request, Response, NextFunction } from "express";
import { SaveTelemetryBatchCommand } from "../commands/save-telemetry-batch/save-telemetry-batch.command";

const { commandBus } = (global as any).cqrs;

/**
 * @swagger
 * /api/telemetry/batch:
 *   post:
 *     summary: Save batch of telemetry data for a vehicle
 *     description: Saves multiple telemetry records (e.g., from offline buffer)
 *     tags: [Telemetry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - telemetryData
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               telemetryData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - location
 *                     - speed
 *                     - fuelLevel
 *                     - odometer
 *                     - engineTemp
 *                     - timestamp
 *                   properties:
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     speed:
 *                       type: number
 *                     fuelLevel:
 *                       type: number
 *                     odometer:
 *                       type: number
 *                     engineTemp:
 *                       type: number
 *                     engineRPM:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *               deviceId:
 *                 type: string
 *                 example: "device-001"
 *     responses:
 *       201:
 *         description: Batch saved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
export const post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, telemetryData, deviceId } = req.body;

    const command = new SaveTelemetryBatchCommand(
      vehicleId,
      telemetryData.map((data: any) => ({
        ...data,
        timestamp: new Date(data.timestamp),
      })),
      deviceId
    );

    const result = await commandBus.execute(command);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};
