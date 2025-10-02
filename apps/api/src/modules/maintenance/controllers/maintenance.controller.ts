import { Request, Response, NextFunction } from "express";
import { Container } from "../../../infrastructure/event-source/container";
import { CommandBus } from "../../../infrastructure/event-source/command-bus";
import { QueryBus } from "../../../infrastructure/event-source/query-bus";
import { CreateMaintenanceCommand } from "../commands/create-maintenance";
import { UpdateMaintenanceCommand } from "../commands/update-maintenance";
import { GetMaintenanceByIdQuery } from "../queries/get-maintenance-by-id";
import { asyncControllerWrapper } from "../../../infrastructure/utils/async-controller-wrapper";

const commandBus = Container.resolve(CommandBus);
const queryBus = Container.resolve(QueryBus);

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     summary: Create a new maintenance record
 *     tags: [Maintenance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - type
 *               - title
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 description: ID of the vehicle
 *               type:
 *                 type: string
 *                 enum: [SCHEDULED, REPAIR, INSPECTION, EMERGENCY]
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               mechanicId:
 *                 type: string
 *               mechanicName:
 *                 type: string
 *               odometerReading:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Maintenance record created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Vehicle not found
 */
export const post = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const command = new CreateMaintenanceCommand(
    req.body.vehicleId,
    req.body.type,
    req.body.title,
    req.body.description,
    req.body.scheduledAt,
    req.body.mechanicId,
    req.body.mechanicName,
    req.body.odometerReading,
    req.body.notes
  );

  const result = await commandBus.execute(command);

  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/maintenance:
 *   patch:
 *     summary: Update maintenance record
 *     tags: [Maintenance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Maintenance record ID
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                     cost:
 *                       type: number
 *                       minimum: 0
 *               laborCost:
 *                 type: number
 *                 minimum: 0
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *               mechanicId:
 *                 type: string
 *               mechanicName:
 *                 type: string
 *               notes:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Maintenance record updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Maintenance record not found
 */
export const patch = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const command = new UpdateMaintenanceCommand(
    req.body.id,
    req.body.status,
    req.body.parts,
    req.body.laborCost,
    req.body.startedAt,
    req.body.completedAt,
    req.body.mechanicId,
    req.body.mechanicName,
    req.body.notes
  );

  const result = await commandBus.execute(command);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     summary: Get maintenance records (by ID, vehicle, or paginated list)
 *     tags: [Maintenance]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Maintenance record ID (returns single record)
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Maintenance records retrieved successfully
 *       404:
 *         description: Maintenance record not found
 */
export const get = asyncControllerWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const { id, vehicleId, status, page, limit } = req.query;

  // If ID is provided, return single record
  if (id) {
    const query = new GetMaintenanceByIdQuery(id as string);
    const result = await queryBus.execute(query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  // Otherwise, return paginated list with filters
  const { Maintenance } = await import("../models/maintenance");

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter: any = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  if (status) filter.status = status;

  // Execute query with pagination
  const [data, total] = await Promise.all([
    Maintenance.find(filter)
      .populate("vehicleId", "vin licensePlate manufacturer vehicleModel")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Maintenance.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
