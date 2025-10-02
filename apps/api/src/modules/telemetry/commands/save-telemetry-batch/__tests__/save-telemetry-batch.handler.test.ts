import { SaveTelemetryBatchHandler } from "../save-telemetry-batch.handler";
import { SaveTelemetryBatchCommand } from "../save-telemetry-batch.command";
import { Telemetry } from "../../../models/telemetry";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType } from "@tenderd-fms/core-types";
import { NotFoundError } from "../../../../../shared/errors/apiError";

describe("SaveTelemetryBatchHandler", () => {
  let handler: SaveTelemetryBatchHandler;
  let vehicleId: string;

  beforeEach(async () => {
    handler = new SaveTelemetryBatchHandler();

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
    it("should save batch of telemetry records", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.saved).toBe(2);
      expect(result.validation.total).toBe(2);
      expect(result.validation.valid).toBe(2);
      expect(result.validation.invalid).toBe(0);
    });

    it("should sort telemetry by timestamp (oldest first)", async () => {
      // Arrange - Provide unsorted data
      const telemetryData = [
        {
          location: { lat: 40.7148, lng: -74.008 },
          speed: 70,
          fuelLevel: 79,
          odometer: 12020,
          engineTemp: 92,
          timestamp: new Date("2024-01-15T10:20:00Z"), // Latest
        },
        {
          location: { lat: 40.7128, lng: -74.006 },
          speed: 60,
          fuelLevel: 80,
          odometer: 12000,
          engineTemp: 85,
          timestamp: new Date("2024-01-15T10:00:00Z"), // Earliest
        },
        {
          location: { lat: 40.7138, lng: -74.007 },
          speed: 65,
          fuelLevel: 79.5,
          odometer: 12010,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"), // Middle
        },
      ];

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      await handler.execute(command);

      // Assert
      const saved = await Telemetry.find({ vehicleId }).sort({ timestamp: 1 });
      expect(saved[0].odometer).toBe(12000); // Earliest
      expect(saved[1].odometer).toBe(12010); // Middle
      expect(saved[2].odometer).toBe(12020); // Latest
    });

    it("should throw NotFoundError if vehicle does not exist", async () => {
      // Arrange
      const invalidVehicleId = "507f1f77bcf86cd799439011";
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

      const command = new SaveTelemetryBatchCommand(invalidVehicleId, telemetryData);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
      await expect(handler.execute(command)).rejects.toThrow(`Vehicle not found: ${invalidVehicleId}`);
    });

    it("should perform sequential validation across batch", async () => {
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
          odometer: 11990,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.total).toBe(2);
      expect(result.validation.valid).toBe(1);
      expect(result.validation.invalid).toBe(1);
      expect(result.validation.issues).toHaveLength(1);
      expect(result.validation.issues[0].issues.some((issue: string) => issue.includes("Odometer decreased"))).toBe(
        true
      );
    });

    it("should update vehicle with latest telemetry", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      await handler.execute(command);

      // Assert
      const updatedVehicle = await Vehicle.findById(vehicleId);
      expect(updatedVehicle?.currentTelemetry?.speed).toBe(65); // Latest
      expect(updatedVehicle?.currentTelemetry?.odometer).toBe(12010); // Latest
      expect(updatedVehicle?.currentTelemetry?.location.coordinates).toEqual([-74.007, 40.7138]);
    });

    it("should set vehicle connection status to ONLINE", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      await handler.execute(command);

      // Assert
      const updatedVehicle = await Vehicle.findById(vehicleId);
      expect(updatedVehicle?.connectionStatus).toBe("ONLINE");
      expect(updatedVehicle?.lastSeenAt).toBeDefined();
      expect(updatedVehicle?.offlineSince).toBeUndefined();
    });

    it("should save all records even if some are invalid", async () => {
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
          odometer: 11990,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
        {
          location: { lat: 40.7148, lng: -74.008 },
          speed: 70,
          fuelLevel: 79,
          odometer: 12020,
          engineTemp: 92,
          timestamp: new Date("2024-01-15T10:20:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.saved).toBe(3);
      const savedCount = await Telemetry.countDocuments({ vehicleId });
      expect(savedCount).toBe(3);
    });

    it("should track validation issues with timestamps", async () => {
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
          odometer: 11990,
          engineTemp: 90,
          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.issues).toHaveLength(1);
      expect(result.validation.issues[0].timestamp).toEqual(new Date("2024-01-15T10:10:00Z"));
      expect(result.validation.issues[0].severity).toBe("MEDIUM");
    });

    it("should handle optional engineRPM field", async () => {
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
        {
          location: { lat: 40.7138, lng: -74.007 },
          speed: 65,
          fuelLevel: 79.5,
          odometer: 12010,
          engineTemp: 90,

          timestamp: new Date("2024-01-15T10:10:00Z"),
        },
      ];

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      await handler.execute(command);

      // Assert
      const saved = await Telemetry.find({ vehicleId }).sort({ timestamp: 1 });
      expect(saved[0].engineRPM).toBe(2500);
      expect(saved[1].engineRPM).toBeUndefined();
    });

    it("should handle optional deviceId field", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData, "device-001");

      // Act
      await handler.execute(command);

      // Assert
      const saved = await Telemetry.findOne({ vehicleId });
      expect(saved?.deviceId).toBe("device-001");
    });

    it("should use bulk insert for performance", async () => {
      // Arrange
      const telemetryData = Array.from({ length: 50 }, (_, i) => ({
        location: { lat: 40.7128 + i * 0.0001, lng: -74.006 + i * 0.0001 },
        speed: 60 + (i % 50),
        fuelLevel: Math.max(20, 80 - i * 0.5),
        odometer: 12000 + i * 10,
        engineTemp: 85 + (i % 20) * 0.5,
        timestamp: new Date(Date.UTC(2024, 0, 15, 10, 0, 0) + i * 60000),
      }));

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.saved).toBe(50);
      const count = await Telemetry.countDocuments({ vehicleId });
      expect(count).toBe(50);
    });

    it("should validate against existing telemetry before batch", async () => {
      // Arrange
      await Telemetry.create({
        vehicleId,
        location: {
          type: "Point",
          coordinates: [-74.005, 40.7118],
        },
        speed: 55,
        fuelLevel: 85,
        odometer: 11990,
        engineTemp: 80,
        timestamp: new Date("2024-01-15T09:50:00Z"),
        validation: { schemaValid: true, contextValid: true, issues: [] },
        receivedAt: new Date(),
      });

      // Act
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.valid).toBe(1);
      expect(result.validation.invalid).toBe(0);
    });

    it("should detect invalid first record in batch against existing telemetry", async () => {
      // Arrange
      await Telemetry.create({
        vehicleId,
        location: {
          type: "Point",
          coordinates: [-74.005, 40.7118],
        },
        speed: 55,
        fuelLevel: 85,
        odometer: 12500,
        engineTemp: 80,
        timestamp: new Date("2024-01-15T09:50:00Z"),
        validation: { schemaValid: true, contextValid: true, issues: [] },
        receivedAt: new Date(),
      });

      // Act
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.valid).toBe(0);
      expect(result.validation.invalid).toBe(1);
    });

    it("should handle empty batch gracefully", async () => {
      // Arrange
      const telemetryData: any[] = [];
      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow();
    });

    it("should handle single record batch", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.saved).toBe(1);
      expect(result.validation.total).toBe(1);
      expect(result.validation.valid).toBe(1);
    });

    it("should save GeoJSON location format correctly", async () => {
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

      const command = new SaveTelemetryBatchCommand(vehicleId, telemetryData);

      // Act
      await handler.execute(command);

      // Assert
      const saved = await Telemetry.findOne({ vehicleId });
      expect(saved?.location.type).toBe("Point");
      expect(saved?.location.coordinates).toEqual([-74.006, 40.7128]); // [lng, lat]
    });
  });
});
