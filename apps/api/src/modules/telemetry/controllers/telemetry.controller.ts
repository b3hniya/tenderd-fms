import { Request, Response, NextFunction } from "express";
import { SaveTelemetryCommand } from "../commands/save-telemetry/save-telemetry.command";

const { commandBus } = (global as any).cqrs;

/**
 * @swagger
 * /api/telemetry:
 *   post:
 *     summary: Save telemetry data for a vehicle
 *     description: Saves a single telemetry record with contextual validation
 *     tags: [Telemetry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - location
 *               - speed
 *               - fuelLevel
 *               - odometer
 *               - engineTemp
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 40.7128
 *                   lng:
 *                     type: number
 *                     example: -74.0060
 *               speed:
 *                 type: number
 *                 example: 65.5
 *                 minimum: 0
 *                 maximum: 300
 *               fuelLevel:
 *                 type: number
 *                 example: 75.5
 *                 minimum: 0
 *                 maximum: 100
 *               odometer:
 *                 type: number
 *                 example: 125430
 *                 minimum: 0
 *               engineTemp:
 *                 type: number
 *                 example: 90
 *                 minimum: -50
 *                 maximum: 200
 *               engineRPM:
 *                 type: number
 *                 example: 2500
 *                 minimum: 0
 *                 maximum: 10000
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *               deviceId:
 *                 type: string
 *                 example: "device-001"
 *     responses:
 *       201:
 *         description: Telemetry saved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
export const post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, location, speed, fuelLevel, odometer, engineTemp, engineRPM, timestamp, deviceId } = req.body;

    const command = new SaveTelemetryCommand(
      vehicleId,
      location,
      speed,
      fuelLevel,
      odometer,
      engineTemp,
      engineRPM,
      timestamp ? new Date(timestamp) : undefined,
      deviceId
    );

    const telemetry = await commandBus.execute(command);

    res.status(201).json({
      success: true,
      data: telemetry,
    });
  } catch (error: any) {
    next(error);
  }
};
