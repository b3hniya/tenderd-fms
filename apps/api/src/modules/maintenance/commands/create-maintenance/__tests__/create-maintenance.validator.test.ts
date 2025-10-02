import { CreateMaintenanceValidator } from "../create-maintenance.validator";
import { CreateMaintenanceCommand } from "../create-maintenance.command";
import { MaintenanceType } from "@tenderd-fms/core-types";

describe("CreateMaintenanceValidator", () => {
  let validator: CreateMaintenanceValidator;

  beforeEach(() => {
    validator = new CreateMaintenanceValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid required fields", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Engine oil change"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation with all fields", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Complete service",
        "Full vehicle inspection and maintenance",
        new Date("2025-10-15T10:00:00Z"),
        "mech-001",
        "John Smith",
        10000,
        "Customer requested early service"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with empty vehicleId", () => {
      // Arrange
      const command = new CreateMaintenanceCommand("", MaintenanceType.REPAIR, "Oil change");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "vehicleId")).toBe(true);
    });

    it("should fail validation with empty title", () => {
      // Arrange
      const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", MaintenanceType.REPAIR, "");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "title")).toBe(true);
    });

    it("should fail validation with title exceeding max length", () => {
      // Arrange
      const longTitle = "a".repeat(201); // Max is 200
      const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", MaintenanceType.REPAIR, longTitle);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "title")).toBe(true);
    });

    it("should pass validation with title at max length", () => {
      // Arrange
      const maxTitle = "a".repeat(200);
      const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", MaintenanceType.REPAIR, maxTitle);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with description exceeding max length", () => {
      // Arrange
      const longDescription = "a".repeat(2001); // Max is 2000
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        longDescription
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "description")).toBe(true);
    });

    it("should pass validation with description at max length", () => {
      // Arrange
      const maxDescription = "a".repeat(2000);
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        maxDescription
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with invalid maintenance type", () => {
      // Arrange
      const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", "INVALID_TYPE" as any, "Service");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "type")).toBe(true);
    });

    it("should pass validation with all valid maintenance types", () => {
      // Arrange
      const types = [
        MaintenanceType.SCHEDULED,
        MaintenanceType.REPAIR,
        MaintenanceType.INSPECTION,
        MaintenanceType.EMERGENCY,
      ];

      // Act & Assert
      for (const type of types) {
        const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", type, "Service");
        const result = validator.validate(command);
        expect(result.isValid).toBe(true);
      }
    });

    it("should pass validation with valid scheduledAt date", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.SCHEDULED,
        "Planned service",
        undefined,
        new Date("2025-11-01T10:00:00Z")
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with negative odometer reading", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        undefined,
        undefined,
        undefined,
        undefined,
        -100
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "odometerReading")).toBe(true);
    });

    it("should pass validation with zero odometer reading", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.INSPECTION,
        "Pre-delivery inspection",
        undefined,
        undefined,
        undefined,
        undefined,
        0
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid odometer reading", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        undefined,
        undefined,
        undefined,
        undefined,
        50000
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with notes exceeding max length", () => {
      // Arrange
      const longNotes = "a".repeat(5001); // Max is 5000
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
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
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
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

    it("should pass validation with optional mechanicId", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        undefined,
        undefined,
        "mech-123"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with optional mechanicName", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        undefined,
        undefined,
        undefined,
        "Mike Johnson"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should trim whitespace from title", () => {
      // Arrange
      const command = new CreateMaintenanceCommand("507f1f77bcf86cd799439011", MaintenanceType.REPAIR, "  Service  ");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should trim whitespace from description", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        "  Description with spaces  "
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with undefined optional fields", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "507f1f77bcf86cd799439011",
        MaintenanceType.REPAIR,
        "Service",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate multiple errors at once", () => {
      // Arrange
      const command = new CreateMaintenanceCommand(
        "", // Invalid vehicleId
        "INVALID" as any, // Invalid type
        "", // Invalid title
        undefined,
        undefined,
        undefined,
        undefined,
        -50 // Invalid odometer
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
