import { UpdateMaintenanceHandler } from "../update-maintenance.handler";
import { UpdateMaintenanceCommand } from "../update-maintenance.command";
import { Maintenance } from "../../../models/maintenance";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType, MaintenanceType, MaintenanceStatus } from "@tenderd-fms/core-types";
import { NotFoundError } from "../../../../../shared/errors/apiError";

describe("UpdateMaintenanceHandler", () => {
  let handler: UpdateMaintenanceHandler;
  let vehicleId: string;
  let maintenanceId: string;

  beforeEach(async () => {
    handler = new UpdateMaintenanceHandler();

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
      title: "Oil change",
      description: "Regular maintenance",
      scheduledAt: new Date("2025-10-15T10:00:00Z"),
    });

    maintenanceId = (maintenance._id as any).toString();
  });

  describe("execute", () => {
    it("should update maintenance status", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.IN_PROGRESS);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it("should update parts and auto-calculate total cost", async () => {
      // Arrange
      const parts = [
        { name: "Oil Filter", quantity: 1, cost: 12.0 },
        { name: "Engine Oil", quantity: 5, cost: 8.5 },
      ];
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, parts, 50.0);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.parts).toHaveLength(2);
      expect(result.parts[0].name).toBe("Oil Filter");
      expect(result.laborCost).toBe(50.0);
      // Total: (1 * 12) + (5 * 8.5) + 50 = 104.5
      expect(result.totalCost).toBe(104.5);
    });

    it("should update labor cost", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, undefined, 75.0);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.laborCost).toBe(75.0);
    });

    it("should update startedAt timestamp", async () => {
      // Arrange
      const startTime = new Date("2025-10-15T10:00:00Z");
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.IN_PROGRESS,
        undefined,
        undefined,
        startTime
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.startedAt).toEqual(startTime);
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it("should update completedAt timestamp", async () => {
      // Arrange
      const completedTime = new Date("2025-10-15T12:00:00Z");
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.COMPLETED,
        undefined,
        undefined,
        undefined,
        completedTime
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.completedAt).toEqual(completedTime);
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
    });

    it("should update mechanic information", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        undefined,
        undefined,
        undefined,
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

    it("should update notes", async () => {
      // Arrange
      const notes = "Work completed successfully. Recommended next service at 20,000 km.";
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        undefined,
        undefined,
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

    it("should throw NotFoundError if maintenance record does not exist", async () => {
      // Arrange
      const invalidId = "507f1f77bcf86cd799439011";
      const command = new UpdateMaintenanceCommand(invalidId, MaintenanceStatus.COMPLETED);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
      await expect(handler.execute(command)).rejects.toThrow(`Maintenance record not found: ${invalidId}`);
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const parts = [{ name: "Brake Pads", quantity: 4, cost: 25.0 }];
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.COMPLETED,
        parts,
        100.0,
        new Date("2025-10-15T10:00:00Z"),
        new Date("2025-10-15T12:00:00Z"),
        "mech-456",
        "Sarah Williams",
        "All work completed as expected"
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.parts).toHaveLength(1);
      expect(result.laborCost).toBe(100.0);
      expect(result.totalCost).toBe(200.0); // (4 * 25) + 100
      expect(result.startedAt).toEqual(new Date("2025-10-15T10:00:00Z"));
      expect(result.completedAt).toEqual(new Date("2025-10-15T12:00:00Z"));
      expect(result.mechanicId).toBe("mech-456");
      expect(result.mechanicName).toBe("Sarah Williams");
      expect(result.notes).toBe("All work completed as expected");
    });

    it("should handle status workflow SCHEDULED -> IN_PROGRESS -> COMPLETED", async () => {
      // SCHEDULED (initial)
      let maintenance = await Maintenance.findById(maintenanceId);
      expect(maintenance?.status).toBe(MaintenanceStatus.SCHEDULED);

      // SCHEDULED -> IN_PROGRESS
      const command1 = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.IN_PROGRESS,
        undefined,
        undefined,
        new Date()
      );
      await handler.execute(command1);

      maintenance = await Maintenance.findById(maintenanceId);
      expect(maintenance?.status).toBe(MaintenanceStatus.IN_PROGRESS);

      // IN_PROGRESS -> COMPLETED
      const command2 = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.COMPLETED,
        undefined,
        undefined,
        undefined,
        new Date()
      );
      const result = await handler.execute(command2);

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
    });

    it("should handle status change to CANCELLED", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.CANCELLED);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
    });

    it("should preserve existing fields when updating only one field", async () => {
      // Arrange
      const originalMaintenance = await Maintenance.findById(maintenanceId);
      const originalTitle = originalMaintenance?.title;
      const originalType = originalMaintenance?.type;

      const command = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.IN_PROGRESS);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(result.title).toBe(originalTitle);
      expect(result.type).toBe(originalType);
    });

    it("should update only parts without labor cost", async () => {
      // Arrange
      const parts = [{ name: "Air Filter", quantity: 1, cost: 15.0 }];
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, parts);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.parts).toHaveLength(1);
      expect(result.totalCost).toBe(15.0); // Only parts cost
      expect(result.laborCost).toBeUndefined();
    });

    it("should update only labor cost without parts", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, undefined, 60.0);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.laborCost).toBe(60.0);
      expect(result.parts).toHaveLength(0); // Empty array from initial creation
      expect(result.totalCost).toBeUndefined();
    });

    it("should handle empty parts array", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, []);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.parts).toHaveLength(0);
      expect(result.totalCost).toBeUndefined();
    });

    it("should handle multiple parts with different quantities", async () => {
      // Arrange
      const parts = [
        { name: "Spark Plug", quantity: 4, cost: 8.0 },
        { name: "Air Filter", quantity: 1, cost: 20.0 },
        { name: "Cabin Filter", quantity: 1, cost: 15.0 },
      ];
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, parts, 80.0);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.parts).toHaveLength(3);
      // Total: (4 * 8) + (1 * 20) + (1 * 15) + 80 = 147
      expect(result.totalCost).toBe(147.0);
    });

    it("should handle zero labor cost", async () => {
      // Arrange
      const parts = [{ name: "Wiper Blades", quantity: 2, cost: 10.0 }];
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, parts, 0);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.laborCost).toBe(0);
      expect(result.totalCost).toBe(20.0); // Only parts cost
    });

    it("should update updatedAt timestamp", async () => {
      // Arrange
      const originalMaintenance = await Maintenance.findById(maintenanceId);
      const originalUpdatedAt = originalMaintenance?.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait to ensure timestamp changes

      const command = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.IN_PROGRESS);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
    });

    it("should handle updating with same values (idempotent)", async () => {
      // Arrange
      const command1 = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.IN_PROGRESS);
      await handler.execute(command1);

      // Act - Update with same status
      const command2 = new UpdateMaintenanceCommand(maintenanceId, MaintenanceStatus.IN_PROGRESS);
      const result = await handler.execute(command2);

      // Assert
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it("should handle partial mechanic information update", async () => {
      // Arrange - Set initial mechanic
      const command1 = new UpdateMaintenanceCommand(
        maintenanceId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "mech-001",
        "John Doe"
      );
      await handler.execute(command1);

      // Act - Update only mechanic name
      const command2 = new UpdateMaintenanceCommand(
        maintenanceId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "Jane Doe"
      );
      const result = await handler.execute(command2);

      // Assert
      expect(result.mechanicId).toBe("mech-001"); // Preserved
      expect(result.mechanicName).toBe("Jane Doe"); // Updated
    });

    it("should persist changes to database", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        maintenanceId,
        MaintenanceStatus.COMPLETED,
        [{ name: "Oil", quantity: 5, cost: 8.0 }],
        50.0
      );

      // Act
      await handler.execute(command);

      // Assert - Fetch from DB to verify persistence
      const savedMaintenance = await Maintenance.findById(maintenanceId);
      expect(savedMaintenance?.status).toBe(MaintenanceStatus.COMPLETED);
      expect(savedMaintenance?.parts).toHaveLength(1);
      expect(savedMaintenance?.laborCost).toBe(50.0);
      expect(savedMaintenance?.totalCost).toBe(90.0);
    });

    it("should not modify fields not specified in command", async () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(maintenanceId, undefined, undefined, 100.0);

      // Act
      const result = await handler.execute(command);

      // Assert - Status should remain unchanged
      expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
      expect(result.laborCost).toBe(100.0);
    });
  });
});
