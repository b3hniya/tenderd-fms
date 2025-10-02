import { Request, Response, NextFunction } from "express";
import { CreateVehicleCommand } from "../commands/create-vehicle/create-vehicle.command";
import { GetAllVehiclesQuery } from "../queries/get-all-vehicles/get-all-vehicles.query";

const { commandBus, queryBus } = (global as any).cqrs;

/**
 * @swagger
 * /api/vehicle:
 *   post:
 *     summary: Create a new vehicle
 *     description: Creates a new vehicle in the fleet management system
 *     tags: [Vehicle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - licensePlate
 *               - vehicleModel
 *               - manufacturer
 *               - year
 *               - type
 *               - fuelType
 *             properties:
 *               vin:
 *                 type: string
 *                 example: "1HGBH41JXMN109186"
 *                 description: Vehicle Identification Number (17 characters)
 *               licensePlate:
 *                 type: string
 *                 example: "ABC-1234"
 *               vehicleModel:
 *                 type: string
 *                 example: "Model S"
 *               manufacturer:
 *                 type: string
 *                 example: "Tesla"
 *               year:
 *                 type: number
 *                 example: 2024
 *               type:
 *                 type: string
 *                 enum: [SEDAN, SUV, TRUCK, VAN, BUS, MOTORCYCLE, OTHER]
 *                 example: "SEDAN"
 *               fuelType:
 *                 type: string
 *                 enum: [GASOLINE, DIESEL, ELECTRIC, HYBRID, CNG, LPG, OTHER]
 *                 example: "ELECTRIC"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MAINTENANCE, INACTIVE, OUT_OF_SERVICE]
 *                 default: ACTIVE
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
export const post = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vin, licensePlate, vehicleModel, manufacturer, year, type, fuelType, status } = req.body;

    const command = new CreateVehicleCommand(
      vin,
      licensePlate,
      vehicleModel,
      manufacturer,
      year,
      type,
      fuelType,
      status
    );

    const vehicle = await commandBus.execute(command);

    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @swagger
 * /api/vehicle:
 *   get:
 *     summary: Get vehicle(s)
 *     description: Get a specific vehicle by ID, VIN, or get all vehicles with pagination
 *     tags: [Vehicle]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the vehicle
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: vin
 *         schema:
 *           type: string
 *         description: Vehicle Identification Number (VIN)
 *         example: "1HGBH41JXMN109186"
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, INACTIVE, OUT_OF_SERVICE]
 *         description: Filter by vehicle status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, TRUCK, VAN, BUS, MOTORCYCLE, OTHER]
 *         description: Filter by vehicle type
 *     responses:
 *       200:
 *         description: Vehicle(s) retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, vin, status, type } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query = new GetAllVehiclesQuery(
      page,
      limit,
      status as any,
      type as any,
      vin as string | undefined,
      id as string | undefined
    );

    const result = await queryBus.execute(query);

    if ((id || vin) && result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: id ? `Vehicle with ID ${id} not found` : `Vehicle with VIN ${vin} not found`,
      });
    }

    if (id || vin) {
      return res.status(200).json({
        success: true,
        data: result.data[0],
      });
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    next(error);
  }
};
