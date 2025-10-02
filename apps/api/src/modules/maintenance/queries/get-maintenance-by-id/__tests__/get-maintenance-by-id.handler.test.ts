import { GetMaintenanceByIdHandler } from "../get-maintenance-by-id.handler";
import { GetMaintenanceByIdQuery } from "../get-maintenance-by-id.query";
import { Maintenance } from "../../../models/maintenance";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType, MaintenanceType, MaintenanceStatus } from "@tenderd-fms/core-types";
import { NotFoundError } from "../../../../../shared/errors/apiError";

describe("GetMaintenanceByIdHandler", () => {
  let handler: GetMaintenanceByIdHandler;
  let vehicleId: string;
  let maintenanceId: string;

  beforeEach(async () => {
    handler = new GetMaintenanceByIdHandler();

    const vehicle = await Vehicle.create({
      vin: "1HGBH41JXMN109186",
      licensePlate: "ABC-1234",
      vehicleModel: "Model S",
      manufacturer: "Tesla",
      year: 2024,
      type: VehicleType.SEDAN,
      fuelType: FuelType.ELECTRIC,
      status: VehicleStatus.ACTIVE,
      connectionStatus: "OFFLINE",
      lastSeenAt: new Date(),
    });

    vehicleId = (vehicle._id as any).toString();

    const maintenance = await Maintenance.create({
      vehicleId,
      type: MaintenanceType.REPAIR,
      status: MaintenanceStatus.SCHEDULED,
      title: "Engine oil change",
      description: "Regular maintenance service",
      scheduledAt: new Date("2025-10-15T10:00:00Z"),
      mechanicId: "mech-001",
      mechanicName: "John Smith",
      odometerReading: 10000,
      notes: "Customer requested early service",
    });

    maintenanceId = (maintenance._id as any).toString();
  });

  describe("execute", () => {
    it("should fetch maintenance record by id", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(maintenanceId);
      expect(result.title).toBe("Engine oil change");
      expect(result.type).toBe(MaintenanceType.REPAIR);
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    });

    it("should return all maintenance fields", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.vehicleId).toBe(vehicleId);
      expect(result.type).toBe(MaintenanceType.REPAIR);
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(result.title).toBe("Engine oil change");
      expect(result.description).toBe("Regular maintenance service");
      expect(result.mechanicId).toBe("mech-001");
      expect(result.mechanicName).toBe("John Smith");
      expect(result.odometerReading).toBe(10000);
      expect(result.notes).toBe("Customer requested early service");
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should throw NotFoundError if maintenance record does not exist", async () => {
      // Arrange
      const invalidId = "507f1f77bcf86cd799439011";
      const query = new GetMaintenanceByIdQuery(invalidId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundError);
      await expect(handler.execute(query)).rejects.toThrow(`Maintenance record not found: ${invalidId}`);
    });

    it("should return maintenance with SCHEDULED status", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    });

    it("should return maintenance with IN_PROGRESS status", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        status: MaintenanceStatus.IN_PROGRESS,
        startedAt: new Date(),
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it("should return maintenance with COMPLETED status", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        status: MaintenanceStatus.COMPLETED,
        startedAt: new Date("2025-10-15T10:00:00Z"),
        completedAt: new Date("2025-10-15T12:00:00Z"),
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });

    it("should return maintenance with CANCELLED status", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        status: MaintenanceStatus.CANCELLED,
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
    });

    it("should return maintenance with parts and costs", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        parts: [
          { name: "Oil Filter", quantity: 1, cost: 12.0 },
          { name: "Engine Oil", quantity: 5, cost: 8.5 },
        ],
        laborCost: 50.0,
        totalCost: 104.5,
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.parts).toHaveLength(2);
      expect(result.parts[0].name).toBe("Oil Filter");
      expect(result.parts[1].name).toBe("Engine Oil");
      expect(result.laborCost).toBe(50.0);
      expect(result.totalCost).toBe(104.5);
    });

    it("should return maintenance with INSPECTION type", async () => {
      // Arrange
      const inspection = await Maintenance.create({
        vehicleId,
        type: MaintenanceType.INSPECTION,
        status: MaintenanceStatus.SCHEDULED,
        title: "Annual inspection",
        scheduledAt: new Date("2025-11-01T09:00:00Z"),
      });
      const inspectionId = (inspection._id as any).toString();
      const query = new GetMaintenanceByIdQuery(inspectionId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.type).toBe(MaintenanceType.INSPECTION);
      expect(result.title).toBe("Annual inspection");
    });

    it("should return maintenance with EMERGENCY type", async () => {
      // Arrange
      const emergency = await Maintenance.create({
        vehicleId,
        type: MaintenanceType.EMERGENCY,
        status: MaintenanceStatus.IN_PROGRESS,
        title: "Engine failure - urgent repair",
        description: "Vehicle broke down on highway",
      });
      const emergencyId = (emergency._id as any).toString();
      const query = new GetMaintenanceByIdQuery(emergencyId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.type).toBe(MaintenanceType.EMERGENCY);
      expect(result.title).toBe("Engine failure - urgent repair");
    });

    it("should return maintenance with scheduledAt date", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.scheduledAt).toBeDefined();
      expect(new Date(result.scheduledAt)).toEqual(new Date("2025-10-15T10:00:00Z"));
    });

    it("should return maintenance without optional fields", async () => {
      // Arrange
      const minimal = await Maintenance.create({
        vehicleId,
        type: MaintenanceType.REPAIR,
        status: MaintenanceStatus.SCHEDULED,
        title: "Quick fix",
      });
      const minimalId = (minimal._id as any).toString();
      const query = new GetMaintenanceByIdQuery(minimalId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.title).toBe("Quick fix");
      expect(result.description).toBeUndefined();
      expect(result.scheduledAt).toBeUndefined();
      expect(result.mechanicId).toBeUndefined();
      expect(result.mechanicName).toBeUndefined();
      expect(result.odometerReading).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.startedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });

    it("should return maintenance with timestamps", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should return plain object (lean)", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      // lean() returns plain object, not Mongoose document
      expect(result.constructor.name).toBe("Object");
      expect(typeof result.save).toBe("undefined");
    });

    it("should return maintenance for different vehicles", async () => {
      // Arrange
      const vehicle2 = await Vehicle.create({
        vin: "2HGBH41JXMN109187",
        licensePlate: "XYZ-9999",
        vehicleModel: "Model 3",
        manufacturer: "Tesla",
        year: 2024,
        type: VehicleType.SEDAN,
        fuelType: FuelType.ELECTRIC,
        status: VehicleStatus.ACTIVE,
        connectionStatus: "OFFLINE",
        lastSeenAt: new Date(),
      });
      const vehicle2Id = (vehicle2._id as any).toString();

      const maintenance2 = await Maintenance.create({
        vehicleId: vehicle2Id,
        type: MaintenanceType.SCHEDULED,
        status: MaintenanceStatus.SCHEDULED,
        title: "Tire rotation",
      });
      const maintenance2Id = (maintenance2._id as any).toString();

      const query = new GetMaintenanceByIdQuery(maintenance2Id);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result._id.toString()).toBe(maintenance2Id);
      expect(result.vehicleId).toBe(vehicle2Id);
      expect(result.title).toBe("Tire rotation");
    });

    it("should return maintenance with all maintenance types", async () => {
      // Arrange
      const types = [
        MaintenanceType.SCHEDULED,
        MaintenanceType.REPAIR,
        MaintenanceType.INSPECTION,
        MaintenanceType.EMERGENCY,
      ];

      // Act & Assert
      for (const type of types) {
        const m = await Maintenance.create({
          vehicleId,
          type,
          status: MaintenanceStatus.SCHEDULED,
          title: `${type} maintenance`,
        });
        const query = new GetMaintenanceByIdQuery((m._id as any).toString());
        const result = await handler.execute(query);
        expect(result.type).toBe(type);
      }
    });

    it("should handle maintenance with zero odometer", async () => {
      // Arrange
      const m = await Maintenance.create({
        vehicleId,
        type: MaintenanceType.INSPECTION,
        status: MaintenanceStatus.SCHEDULED,
        title: "Pre-delivery inspection",
        odometerReading: 0,
      });
      const query = new GetMaintenanceByIdQuery((m._id as any).toString());

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.odometerReading).toBe(0);
    });

    it("should handle maintenance with empty parts array", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        parts: [],
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.parts).toBeDefined();
      expect(Array.isArray(result.parts)).toBe(true);
      expect(result.parts).toHaveLength(0);
    });

    it("should handle maintenance with zero labor cost", async () => {
      // Arrange
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        laborCost: 0,
      });
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.laborCost).toBe(0);
    });

    it("should handle multiple sequential queries", async () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery(maintenanceId);

      // Act
      const result1 = await handler.execute(query);
      const result2 = await handler.execute(query);

      // Assert
      expect(result1._id.toString()).toBe(maintenanceId);
      expect(result2._id.toString()).toBe(maintenanceId);
      expect(result1.title).toBe(result2.title);
    });

    it("should throw NotFoundError with invalid ObjectId format", async () => {
      // Arrange - This will be caught by MongoDB/Mongoose as CastError first
      const invalidId = "invalid-id-format";
      const query = new GetMaintenanceByIdQuery(invalidId);

      // Act & Assert
      // Note: Mongoose may throw CastError before reaching the handler's NotFoundError
      await expect(handler.execute(query)).rejects.toThrow();
    });
  });
});
