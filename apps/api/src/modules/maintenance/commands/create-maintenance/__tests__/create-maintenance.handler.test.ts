import { CreateMaintenanceHandler } from "../create-maintenance.handler";
import { CreateMaintenanceCommand } from "../create-maintenance.command";
import { Maintenance } from "../../../models/maintenance";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType, MaintenanceType, MaintenanceStatus } from "@tenderd-fms/core-types";
import { NotFoundError } from "../../../../../shared/errors/apiError";

describe("CreateMaintenanceHandler", () => {
  let handler: CreateMaintenanceHandler;
  let vehicleId: string;

  beforeEach(async () => {
    handler = new CreateMaintenanceHandler();

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
  });

  describe("execute", () => {
    it("should create a maintenance record", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.REPAIR,
        "Engine oil change",
        "Regular maintenance service",
        new Date("2025-10-15T10:00:00Z"),
        "mech-001",
        "John Smith",
        10000,
        "Customer requested"
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.vehicleId).toBe(vehicleId);
      expect(result.type).toBe(MaintenanceType.REPAIR);
      expect(result.title).toBe("Engine oil change");
      expect(result.description).toBe("Regular maintenance service");
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(result.mechanicId).toBe("mech-001");
      expect(result.mechanicName).toBe("John Smith");
      expect(result.odometerReading).toBe(10000);
      expect(result.notes).toBe("Customer requested");
    });

    it("should save maintenance record to database", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.INSPECTION, "Annual inspection");

      // Act
      await handler.execute(command);

      // Assert
      const saved = await Maintenance.findOne({ vehicleId, title: "Annual inspection" });
      expect(saved).toBeDefined();
      expect(saved?.type).toBe(MaintenanceType.INSPECTION);
      expect(saved?.status).toBe(MaintenanceStatus.SCHEDULED);
    });

    it("should throw NotFoundError if vehicle does not exist", async () => {
      // Arrange
      const invalidVehicleId = "507f1f77bcf86cd799439011";
      const command = new CreateMaintenanceCommand(invalidVehicleId, MaintenanceType.REPAIR, "Test maintenance");

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
      await expect(handler.execute(command)).rejects.toThrow(`Vehicle not found: ${invalidVehicleId}`);
    });

    it("should set default status to SCHEDULED", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Oil change");

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    });

    it("should handle all maintenance types", async () => {
      // Arrange & Act & Assert
      const types = [
        MaintenanceType.SCHEDULED,
        MaintenanceType.REPAIR,
        MaintenanceType.INSPECTION,
        MaintenanceType.EMERGENCY,
      ];

      for (const type of types) {
        const command = new CreateMaintenanceCommand(vehicleId, type, `${type} maintenance`);
        const result = await handler.execute(command);
        expect(result.type).toBe(type);
      }
    });

    it("should create record with only required fields", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Quick fix");

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.vehicleId).toBe(vehicleId);
      expect(result.type).toBe(MaintenanceType.REPAIR);
      expect(result.title).toBe("Quick fix");
      expect(result.description).toBeUndefined();
      expect(result.scheduledAt).toBeUndefined();
      expect(result.mechanicId).toBeUndefined();
      expect(result.mechanicName).toBeUndefined();
      expect(result.odometerReading).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it("should store scheduledAt date correctly", async () => {
      // Arrange
      const scheduledDate = new Date("2025-11-01T14:30:00Z");
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.SCHEDULED,
        "Preventive maintenance",
        undefined,
        scheduledDate
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.scheduledAt).toEqual(scheduledDate);
    });

    it("should store mechanic information", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.REPAIR,
        "Brake service",
        undefined,
        undefined,
        "mech-123",
        "Mike Johnson"
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.mechanicId).toBe("mech-123");
      expect(result.mechanicName).toBe("Mike Johnson");
    });

    it("should store odometer reading", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.REPAIR,
        "Tire rotation",
        undefined,
        undefined,
        undefined,
        undefined,
        25000
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.odometerReading).toBe(25000);
    });

    it("should store notes", async () => {
      // Arrange
      const notes = "Customer complained about grinding noise when braking";
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.REPAIR,
        "Brake inspection",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        notes
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.notes).toBe(notes);
    });

    it("should include createdAt and updatedAt timestamps", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Service");

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should create multiple maintenance records for same vehicle", async () => {
      // Arrange
      const command1 = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Oil change");
      const command2 = new CreateMaintenanceCommand(vehicleId, MaintenanceType.INSPECTION, "Safety check");

      // Act
      await handler.execute(command1);
      await handler.execute(command2);

      // Assert
      const count = await Maintenance.countDocuments({ vehicleId });
      expect(count).toBe(2);
    });

    it("should handle description field", async () => {
      // Arrange
      const description = "This is a detailed description of the maintenance work to be performed.";
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Complex repair", description);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.description).toBe(description);
    });

    it("should handle EMERGENCY type maintenance", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.EMERGENCY,
        "Engine failure - urgent repair",
        "Vehicle broke down on highway",
        undefined,
        "mech-emergency",
        "Emergency Team"
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.type).toBe(MaintenanceType.EMERGENCY);
      expect(result.title).toBe("Engine failure - urgent repair");
    });

    it("should handle zero odometer reading", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        vehicleId,
        MaintenanceType.INSPECTION,
        "Pre-delivery inspection",
        undefined,
        undefined,
        undefined,
        undefined,
        0
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.odometerReading).toBe(0);
    });

    it("should not have parts or costs initially", async () => {
      // Arrange
      const command = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Service");

      // Act
      const result = await handler.execute(command);

      // Assert
      // parts is initialized as empty array by Mongoose
      expect(result.parts).toBeDefined();
      expect(Array.isArray(result.parts)).toBe(true);
      expect(result.parts).toHaveLength(0);
      expect(result.laborCost).toBeUndefined();
      expect(result.totalCost).toBeUndefined();
      expect(result.startedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });

    it("should generate unique _id for each record", async () => {
      // Arrange
      const command1 = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Service 1");
      const command2 = new CreateMaintenanceCommand(vehicleId, MaintenanceType.REPAIR, "Service 2");

      // Act
      const result1 = await handler.execute(command1);
      const result2 = await handler.execute(command2);

      // Assert
      expect(result1._id).toBeDefined();
      expect(result2._id).toBeDefined();
      expect(result1._id.toString()).not.toBe(result2._id.toString());
    });
  });
});
