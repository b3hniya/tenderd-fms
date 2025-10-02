import { SaveTelemetryHandler } from "../save-telemetry.handler";
import { SaveTelemetryCommand } from "../save-telemetry.command";
import { Telemetry } from "../../../models/telemetry";
import { Vehicle } from "../../../../vehicle/models/vehicle";
import { VehicleType, VehicleStatus, FuelType } from "@tenderd-fms/core-types";
import { NotFoundError } from "../../../../../shared/errors/apiError";

describe("SaveTelemetryHandler", () => {
  let handler: SaveTelemetryHandler;
  let vehicleId: string;

  beforeEach(async () => {
    handler = new SaveTelemetryHandler();

    // Create a test vehicle
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
    it("should save telemetry data for a vehicle", async () => {
      // Arrange
      const command = new SaveTelemetryCommand(
        vehicleId,
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
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.vehicleId).toBe(vehicleId);
      expect(result.speed).toBe(65.5);
      expect(result.fuelLevel).toBe(80.0);
      expect(result.odometer).toBe(12500);
      expect(result.engineTemp).toBe(90);
      expect(result.engineRPM).toBe(2500);
      expect(result.deviceId).toBe("device-001");
      expect(result.validation).toBeDefined();
      expect(result.validation.schemaValid).toBe(true);
      expect(result.validation.contextValid).toBe(true);
    });

    it("should save telemetry with GeoJSON location format", async () => {
      // Arrange
      const command = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.location).toBeDefined();
      expect(result.location.type).toBe("Point");
      expect(result.location.coordinates).toEqual([-74.006, 40.7128]); // [lng, lat]
    });

    it("should throw NotFoundError if vehicle does not exist", async () => {
      // Arrange
      const invalidVehicleId = "507f1f77bcf86cd799439011";
      const command = new SaveTelemetryCommand(invalidVehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
      await expect(handler.execute(command)).rejects.toThrow(`Vehicle not found: ${invalidVehicleId}`);
    });

    it("should update vehicle current telemetry", async () => {
      // Arrange
      const command = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 65.5, 80.0, 12500, 90);

      // Act
      await handler.execute(command);

      // Assert
      const updatedVehicle = await Vehicle.findById(vehicleId);
      expect(updatedVehicle?.currentTelemetry).toBeDefined();
      expect(updatedVehicle?.currentTelemetry?.speed).toBe(65.5);
      expect(updatedVehicle?.currentTelemetry?.fuelLevel).toBe(80.0);
      expect(updatedVehicle?.currentTelemetry?.odometer).toBe(12500);
      expect(updatedVehicle?.currentTelemetry?.engineTemp).toBe(90);
      expect(updatedVehicle?.currentTelemetry?.location.coordinates).toEqual([-74.006, 40.7128]);
    });

    it("should set vehicle connection status to ONLINE", async () => {
      // Arrange
      const command = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act
      await handler.execute(command);

      // Assert
      const updatedVehicle = await Vehicle.findById(vehicleId);
      expect(updatedVehicle?.connectionStatus).toBe("ONLINE");
      expect(updatedVehicle?.lastSeenAt).toBeDefined();
      expect(updatedVehicle?.offlineSince).toBeUndefined();
    });

    it("should perform contextual validation with no previous telemetry", async () => {
      // Arrange
      const command = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.contextValid).toBe(true);
      expect(result.validation.issues).toHaveLength(0);
    });

    it("should detect odometer decrease anomaly", async () => {
      // Arrange
      const firstCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12500,
        85,
        undefined,
        new Date("2024-01-15T10:00:00Z")
      );
      await handler.execute(firstCommand);

      // Act
      const secondCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        74,
        12400, // Lower than previous
        85,
        undefined,
        new Date("2024-01-15T10:10:00Z")
      );
      const result = await handler.execute(secondCommand);

      // Assert
      expect(result.validation.contextValid).toBe(false);
      expect(result.validation.issues.some((issue: string) => issue.includes("Odometer decreased"))).toBe(true);
      expect(result.validation.severity).toBe("MEDIUM");
    });

    it("should detect unrealistic location jump", async () => {
      // Arrange
      const firstCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12500,
        85,
        undefined,
        new Date("2024-01-15T10:00:00Z")
      );
      await handler.execute(firstCommand);

      // Act
      const secondCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 34.0522, lng: -118.2437 }, // LA is ~4000km away
        60,
        74,
        12510,
        85,
        undefined,
        new Date("2024-01-15T10:00:10Z") // Only 10 seconds later
      );
      const result = await handler.execute(secondCommand);

      // Assert
      expect(result.validation.contextValid).toBe(false);
      expect(result.validation.issues.some((issue: string) => issue.includes("Unrealistic location jump"))).toBe(true);
      expect(result.validation.severity).toBe("HIGH");
    });

    it("should detect high engine temperature", async () => {
      // Arrange
      await handler.execute(
        new SaveTelemetryCommand(
          vehicleId,
          { lat: 40.7128, lng: -74.006 },
          60,
          75,
          12000,
          90,
          undefined,
          new Date("2024-01-15T10:00:00Z")
        )
      );

      // Act
      const command = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        74,
        12010,
        125, // High temperature
        undefined,
        new Date("2024-01-15T10:10:00Z")
      );
      const result = await handler.execute(command);

      // Assert
      expect(result.validation.contextValid).toBe(false);
      expect(result.validation.issues.some((issue: string) => issue.includes("High engine temperature"))).toBe(true);
    });

    it("should accept valid sequential telemetry", async () => {
      // Arrange
      const firstCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        80,
        12500,
        85,
        undefined,
        new Date("2024-01-15T10:00:00Z")
      );
      await handler.execute(firstCommand);

      // Act
      const secondCommand = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7138, lng: -74.007 }, // ~100m away
        65,
        79.5,
        12510, // 10km driven
        90,
        undefined,
        new Date("2024-01-15T10:10:00Z")
      );
      const result = await handler.execute(secondCommand);

      // Assert
      expect(result.validation.contextValid).toBe(true);
      expect(result.validation.issues).toHaveLength(0);
    });

    it("should use current timestamp if not provided", async () => {
      // Arrange
      const beforeTime = new Date();
      const command = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act
      const result = await handler.execute(command);
      const afterTime = new Date();

      // Assert
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should save telemetry even with validation issues", async () => {
      // Arrange
      await handler.execute(
        new SaveTelemetryCommand(
          vehicleId,
          { lat: 40.7128, lng: -74.006 },
          60,
          75,
          12500,
          85,
          undefined,
          new Date("2024-01-15T10:00:00Z")
        )
      );

      const command = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        74,
        12400, // Decrease
        85,
        undefined,
        new Date("2024-01-15T10:10:00Z")
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result._id).toBeDefined();
      const savedTelemetry = await Telemetry.findById(result._id);
      expect(savedTelemetry).toBeDefined();
      expect(savedTelemetry?.validation.contextValid).toBe(false);
    });

    it("should save receivedAt timestamp", async () => {
      // Arrange
      const beforeTime = new Date();
      const command = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12000,
        85,
        undefined,
        new Date("2024-01-15T10:00:00Z") // Historical timestamp
      );

      // Act
      const result = await handler.execute(command);
      const afterTime = new Date();

      // Assert
      expect(result.receivedAt).toBeDefined();
      expect(new Date(result.receivedAt).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(new Date(result.receivedAt).getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should handle optional engineRPM field", async () => {
      // Arrange
      const commandWithoutRPM = new SaveTelemetryCommand(vehicleId, { lat: 40.7128, lng: -74.006 }, 60, 75, 12000, 85);

      // Act
      const resultWithoutRPM = await handler.execute(commandWithoutRPM);

      // Assert
      expect(resultWithoutRPM.engineRPM).toBeUndefined();

      // Arrange
      const commandWithRPM = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12010,
        85,
        2500
      );

      // Act
      const resultWithRPM = await handler.execute(commandWithRPM);

      // Assert
      expect(resultWithRPM.engineRPM).toBe(2500);
    });

    it("should handle optional deviceId field", async () => {
      // Arrange
      const commandWithoutDevice = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12000,
        85
      );

      // Act
      const resultWithoutDevice = await handler.execute(commandWithoutDevice);

      // Assert
      expect(resultWithoutDevice.deviceId).toBeUndefined();

      // Arrange
      const commandWithDevice = new SaveTelemetryCommand(
        vehicleId,
        { lat: 40.7128, lng: -74.006 },
        60,
        75,
        12010,
        85,
        undefined,
        undefined,
        "device-123"
      );

      // Act
      const resultWithDevice = await handler.execute(commandWithDevice);

      // Assert
      expect(resultWithDevice.deviceId).toBe("device-123");
    });
  });
});
