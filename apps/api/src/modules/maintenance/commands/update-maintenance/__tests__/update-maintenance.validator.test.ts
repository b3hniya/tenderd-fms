import { UpdateMaintenanceValidator } from "../update-maintenance.validator";
import { UpdateMaintenanceCommand } from "../update-maintenance.command";
import { MaintenanceStatus } from "@tenderd-fms/core-types";

describe("UpdateMaintenanceValidator", () => {
  let validator: UpdateMaintenanceValidator;

  beforeEach(() => {
    validator = new UpdateMaintenanceValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid id and status", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", MaintenanceStatus.COMPLETED);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation with only id (no updates)", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with empty id", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("", MaintenanceStatus.COMPLETED);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "id")).toBe(true);
    });

    it("should pass validation with all valid status values", () => {
      // Arrange
      const statuses = [
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.CANCELLED,
      ];

      // Act & Assert
      for (const status of statuses) {
        const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", status);
        const result = validator.validate(command);
        expect(result.isValid).toBe(true);
      }
    });

    it("should fail validation with invalid status", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", "INVALID_STATUS" as any);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "status")).toBe(true);
    });

    it("should pass validation with valid parts", () => {
      // Arrange
      const parts = [
        { name: "Oil Filter", quantity: 1, cost: 12.0 },
        { name: "Engine Oil", quantity: 5, cost: 8.5 },
      ];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with part having invalid quantity (zero)", () => {
      // Arrange
      const parts = [{ name: "Filter", quantity: 0, cost: 10.0 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("quantity"))).toBe(true);
    });

    it("should fail validation with part having negative quantity", () => {
      // Arrange
      const parts = [{ name: "Filter", quantity: -1, cost: 10.0 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("quantity"))).toBe(true);
    });

    it("should fail validation with part having negative cost", () => {
      // Arrange
      const parts = [{ name: "Filter", quantity: 1, cost: -5.0 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("cost"))).toBe(true);
    });

    it("should pass validation with part having zero cost", () => {
      // Arrange
      const parts = [{ name: "Free Part", quantity: 1, cost: 0 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with part having empty name", () => {
      // Arrange
      const parts = [{ name: "", quantity: 1, cost: 10.0 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("name"))).toBe(true);
    });

    it("should pass validation with valid labor cost", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, undefined, 50.0);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with negative labor cost", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, undefined, -10.0);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "laborCost")).toBe(true);
    });

    it("should pass validation with zero labor cost", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, undefined, 0);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid startedAt date", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        new Date("2025-10-15T10:00:00Z")
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid completedAt date", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        undefined,
        new Date("2025-10-15T12:00:00Z")
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with mechanicId", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "mech-123"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with mechanicName", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "John Smith"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with notes", () => {
      // Arrange
      const notes = "Work completed successfully";
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
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
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with notes exceeding max length", () => {
      // Arrange
      const longNotes = "a".repeat(5001); // Max is 5000
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        longNotes
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "notes")).toBe(true);
    });

    it("should pass validation with notes at max length", () => {
      // Arrange
      const maxNotes = "a".repeat(5000);
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        maxNotes
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with all fields", () => {
      // Arrange
      const parts = [{ name: "Filter", quantity: 1, cost: 15.0 }];
      const command = new UpdateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceStatus.COMPLETED,
        parts,
        100.0,
        new Date("2025-10-15T10:00:00Z"),
        new Date("2025-10-15T12:00:00Z"),
        "mech-456",
        "Jane Doe",
        "All work completed"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with empty parts array", () => {
      // Arrange
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, []);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with multiple parts", () => {
      // Arrange
      const parts = [
        { name: "Part 1", quantity: 1, cost: 10.0 },
        { name: "Part 2", quantity: 2, cost: 20.0 },
        { name: "Part 3", quantity: 3, cost: 30.0 },
      ];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate multiple errors at once", () => {
      // Arrange
      const parts = [
        { name: "", quantity: 0, cost: -5.0 }, // All invalid
      ];
      const command = new UpdateMaintenanceCommand(
        "", // Invalid id
        "INVALID" as any, // Invalid status
        parts,
        -50.0 // Invalid labor cost
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it("should pass validation with fractional costs", () => {
      // Arrange
      const parts = [{ name: "Part", quantity: 1, cost: 12.99 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts, 49.95);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with large quantity", () => {
      // Arrange
      const parts = [{ name: "Bolts", quantity: 100, cost: 0.5 }];
      const command = new UpdateMaintenanceCommand("507f1f77bcf86cd799439011", undefined, parts);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });
  });
});
