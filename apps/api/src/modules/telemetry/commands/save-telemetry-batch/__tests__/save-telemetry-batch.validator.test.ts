import { SaveTelemetryBatchValidator } from "../save-telemetry-batch.validator";
import { SaveTelemetryBatchCommand } from "../save-telemetry-batch.command";

describe("SaveTelemetryBatchValidator", () => {
  let validator: SaveTelemetryBatchValidator;

  beforeEach(() => {
    validator = new SaveTelemetryBatchValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid batch data", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          location: { lat: 40.7138, lng: -74.007 },
          speed: 65,
          fuelLevel: 79.5,
          odometer: 12010,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with empty vehicleId", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "vehicleId")).toBe(true);
    });

    it("should fail validation with empty telemetry array", () => {
      // Arrange
      const telemetryData: any[] = [];
      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "telemetryData")).toBe(true);
    });

    it("should fail validation if any record has invalid data", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          location: { lat: 40.7138, lng: -74.007 },
          speed: -10,
          fuelLevel: 79.5,
          odometer: 12010,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("speed"))).toBe(true);
    });

    it("should fail validation if any record has invalid location", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          location: { lat: 95, lng: -74.007 },
          speed: 65,
          fuelLevel: 79.5,
          odometer: 12010,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("lat"))).toBe(true);
    });

    it("should fail validation if fuel level exceeds 100", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 120,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("fuelLevel"))).toBe(true);
    });

    it("should fail validation if odometer is negative", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: -1000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("odometer"))).toBe(true);
    });

    it("should fail validation if engine temp is out of range", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 250,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("engineTemp"))).toBe(true);
    });

    it("should pass validation with optional engineRPM", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          engineRPM: 2500,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation if engineRPM is invalid", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          engineRPM: -100,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field.includes("engineRPM"))).toBe(true);
    });

    it("should pass validation with optional deviceId", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData, "device-001");

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate large batch", () => {
      // Arrange
      const telemetryData = Array.from({ length: 100 }, (_, i) => ({
        location: { lat: 40.7128 + i * 0.0001, lng: -74.006 + i * 0.0001 },
        speed: Math.min(60 + (i % 50), 300),
        fuelLevel: Math.max(0, 80 - i * 0.5),
        odometer: 12000 + i * 10,
        engineTemp: 85 + (i % 20) * 0.5,
        timestamp: new Date(Date.UTC(2024, 0, 15, 10, 0, 0) + i * 60000),
      }));

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation if batch exceeds maximum size", () => {
      // Arrange
      const telemetryData = Array.from({ length: 1001 }, (_, i) => ({
        location: { lat: 40.7128, lng: -74.006 },
        speed: 60,
        fuelLevel: 80,
        odometer: 12000 + i,
        engineTemp: 85,
        timestamp: new Date(`2024-01-15T10:00:00Z`),
      }));

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "telemetryData")).toBe(true);
    });

    it("should validate all records in batch independently", () => {
      // Arrange
      const telemetryData = [
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: -10,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          location: { lat: 40.7138, lng: -74.007 },
          speed: 65,
          fuelLevel: 120,
          odometer: 12010,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand("507f1f77bcf86cd799439011", telemetryData);

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
