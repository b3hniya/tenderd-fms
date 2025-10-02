import { SaveTelemetryValidator } from "../save-telemetry.validator";
import { SaveTelemetryCommand } from "../save-telemetry.command";

describe("SaveTelemetryValidator", () => {
  let validator: SaveTelemetryValidator;

  beforeEach(() => {
    validator = new SaveTelemetryValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid data", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        2500,
        new Date(),
        "device-001"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with empty vehicleId", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "", // Empty vehicleId
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        undefined,
        new Date()
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "vehicleId")).toBe(true);
    });

    it("should fail validation with invalid latitude", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 95, lng: -74.006 }, // lat > 90
        65.5,
        80.0,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("lat"))).toBe(true);
    });

    it("should fail validation with invalid longitude", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -200 }, // lng < -180
        65.5,
        80.0,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("lng"))).toBe(true);
    });

    it("should fail validation with negative speed", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        -10,
        80.0,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "speed")).toBe(true);
    });

    it("should fail validation with speed exceeding max", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        350,
        80.0,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "speed")).toBe(true);
    });

    it("should fail validation with negative fuel level", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        -5,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "fuelLevel")).toBe(true);
    });

    it("should fail validation with fuel level exceeding 100", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        120,
        12500,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "fuelLevel")).toBe(true);
    });

    it("should fail validation with negative odometer", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        -1000,
        90
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "odometer")).toBe(true);
    });

    it("should fail validation with engine temp below min", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        -60
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "engineTemp")).toBe(true);
    });

    it("should fail validation with engine temp above max", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        250
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "engineTemp")).toBe(true);
    });

    it("should pass validation with valid engineRPM", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        2500,
        new Date() // Required timestamp
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with negative engineRPM", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        -100
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "engineRPM")).toBe(true);
    });

    it("should fail validation with engineRPM exceeding max", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        15000
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "engineRPM")).toBe(true);
    });

    it("should pass validation without optional fields", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        undefined,
        new Date(),
        undefined // No deviceId
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass validation with valid timestamp", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        undefined,
        new Date("2024-01-15T10:00:00Z")
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid deviceId", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 40.7128, lng: -74.006 },
        65.5,
        80.0,
        12500,
        90,
        undefined,
        new Date(),
        "device-abc-123"
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate boundary values", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: 90, lng: 180 },
        300,
        100,
        0,
        200,
        undefined,
        new Date()
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate minimum boundary values", () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        "507f1f77bcf86cd799439011",
        { lat: -90, lng: -180 },
        0,
        0,
        0,
        -50,
        undefined,
        new Date()
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });
  });
});
