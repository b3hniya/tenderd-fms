import { CreateVehicleHandler } from "../create-vehicle.handler";
import { CreateVehicleCommand } from "../create-vehicle.command";
import { Vehicle } from "../../../models/vehicle";
import { VehicleType, VehicleStatus, FuelType } from "@tenderd-fms/core-types";

describe("CreateVehicleHandler", () => {
  let handler: CreateVehicleHandler;

  beforeEach(() => {
    handler = new CreateVehicleHandler();
  });

  describe("execute", () => {
    it("should create a vehicle with valid data", async () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC,
        VehicleStatus.ACTIVE
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.vin).toBe("1HGBH41JXMN109186");
      expect(result.licensePlate).toBe("ABC-1234");
      expect(result.vehicleModel).toBe("Model S");
      expect(result.manufacturer).toBe("Tesla");
      expect(result.year).toBe(2024);
      expect(result.type).toBe(VehicleType.SEDAN);
      expect(result.fuelType).toBe(FuelType.ELECTRIC);
      expect(result.status).toBe(VehicleStatus.ACTIVE);
      expect(result.connectionStatus).toBe("OFFLINE");
    });

    it("should create a vehicle with default ACTIVE status when not provided", async () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109187",
        "XYZ-5678",
        "F-150",
        "Ford",
        2023,
        VehicleType.TRUCK,
        FuelType.GASOLINE
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.status).toBe(VehicleStatus.ACTIVE);
    });

    it("should save vehicle to database", async () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109188",
        "DEF-9012",
        "Transit",
        "Ford",
        2022,
        VehicleType.VAN,
        FuelType.DIESEL,
        VehicleStatus.MAINTENANCE
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedVehicle = await Vehicle.findOne({ vin: "1HGBH41JXMN109188" });
      expect(savedVehicle).toBeDefined();
      expect(savedVehicle?.licensePlate).toBe("DEF-9012");
      expect(savedVehicle?.status).toBe(VehicleStatus.MAINTENANCE);
    });

    it("should throw error when duplicate VIN is provided", async () => {
      // Arrange
      const command1 = new CreateVehicleCommand(
        "1HGBH41JXMN109189",
        "ABC-0001",
        "Model 3",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      const command2 = new CreateVehicleCommand(
        "1HGBH41JXMN109189", // Same VIN
        "ABC-0002",
        "Model Y",
        "Tesla",
        2024,
        VehicleType.SUV,
        FuelType.ELECTRIC
      );

      // Act
      await handler.execute(command1);

      // Assert
      await expect(handler.execute(command2)).rejects.toThrow();
    });

    it("should set lastSeenAt timestamp", async () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109190",
        "TST-1111",
        "Accord",
        "Honda",
        2023,
        VehicleType.SEDAN,
        FuelType.HYBRID
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.lastSeenAt).toBeDefined();
      expect(result.lastSeenAt).toBeInstanceOf(Date);
    });

    it("should create vehicle with all vehicle types", async () => {
      const vehicleTypes = [
        VehicleType.SEDAN,
        VehicleType.SUV,
        VehicleType.TRUCK,
        VehicleType.VAN,
        VehicleType.BUS,
        VehicleType.MOTORCYCLE,
        VehicleType.OTHER,
      ];

      for (let i = 0; i < vehicleTypes.length; i++) {
        const vehicleType = vehicleTypes[i];
        const command = new CreateVehicleCommand(
          `1HGBH41JXMN10918${i}`,
          `TYPE-${i}`,
          "Test Model",
          "Test Manufacturer",
          2024,
          vehicleType,
          FuelType.GASOLINE
        );

        const result = await handler.execute(command);
        expect(result.type).toBe(vehicleType);
      }
    });

    it("should create vehicle with all fuel types", async () => {
      const fuelTypes = [
        FuelType.GASOLINE,
        FuelType.DIESEL,
        FuelType.ELECTRIC,
        FuelType.HYBRID,
        FuelType.CNG,
        FuelType.LPG,
        FuelType.OTHER,
      ];

      for (let i = 0; i < fuelTypes.length; i++) {
        const fuelType = fuelTypes[i];
        const command = new CreateVehicleCommand(
          `2HGBH41JXMN10918${i}`,
          `FUEL-${i}`,
          "Test Model",
          "Test Manufacturer",
          2024,
          VehicleType.SEDAN,
          fuelType
        );

        const result = await handler.execute(command);
        expect(result.fuelType).toBe(fuelType);
      }
    });
  });
});
