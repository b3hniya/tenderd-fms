import { Request, Response } from "express";
import { GetVehicleByIdQuery } from "../../queries/get-vehicle-by-id/get-vehicle-by-id.query";
// import { CreateVehicleCommand } from "../../commands/create-vehicle/create-vehicle-command";
// import { GetVehicleByIdQuery } from "../../queries/get-vehicle-by-id/get-vehicle-by-id.query";
// import { GetAllVehiclesQuery } from "../../queries/get-all-vehicles/get-all-vehicles.query";

const { commandBus, queryBus } = (global as any).cqrs;

/**
 * @swagger
 * /api/vehicle/v1/vehicle:
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
 *               - vehicleId
 *               - model
 *               - type
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "TRUCK-001"
 *               model:
 *                 type: string
 *                 example: "Tesla Semi"
 *               type:
 *                 type: string
 *                 example: "Electric Truck"
 *               status:
 *                 type: string
 *                 enum: [active, maintenance, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       500:
 *         description: Internal server error
 */
export const post = async (req: Request, res: Response) => {
  try {
    res.status(201).json({ message: "Vehicle created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/vehicle/v1/vehicle:
 *   get:
 *     summary: Get vehicle(s)
 *     description: Get a specific vehicle by ID or all vehicles
 *     tags: [Vehicle]
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Optional vehicle ID to get a specific vehicle
 *         example: "TRUCK-001"
 *     responses:
 *       200:
 *         description: Vehicle(s) retrieved successfully
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
export const get = async (req: Request, res: Response) => {
  try {
    const query = new GetVehicleByIdQuery(req.query.vehicleId as string);
    const vehicle = await queryBus.execute(query);

    res.status(200).json({ message: "Vehicle(s) retrieved successfully" });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
