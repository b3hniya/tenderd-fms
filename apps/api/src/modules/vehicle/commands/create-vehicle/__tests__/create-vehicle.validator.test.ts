import { CreateVehicleValidator } from "../create-vehicle.validator";
import { CreateVehicleCommand } from "../create-vehicle.command";
import { VehicleType, VehicleStatus, FuelType } from "@tenderd-fms/core-types";

describe("CreateVehicleValidator", () => {
  let validator: CreateVehicleValidator;

  beforeEach(() => {
    validator = new CreateVehicleValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid data", () => {
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
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with invalid VIN (too short)", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "SHORT", // Invalid VIN (not 17 characters)
        "ABC-1234",
        "Model S",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === "vin")).toBe(true);
    });

    it("should fail validation with empty licensePlate", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "", // Empty license plate
        "Model S",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "licensePlate")).toBe(true);
    });

    it("should fail validation with empty vehicleModel", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "", // Empty model
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "vehicleModel")).toBe(true);
    });

    it("should fail validation with empty manufacturer", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "", // Empty manufacturer
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "manufacturer")).toBe(true);
    });

    it("should fail validation with year in the past (before 1900)", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model T",
        "Ford",
        1899, // Too old
        VehicleType.SEDAN,
        FuelType.GASOLINE
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "year")).toBe(true);
    });

    it("should fail validation with year in the future", () => {
      // Arrange
      const futureYear = new Date().getFullYear() + 2;
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Future Car",
        "Tesla",
        futureYear,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "year")).toBe(true);
    });

    it("should pass validation with current year", () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        currentYear,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with next year", () => {
      // Arrange
      const nextYear = new Date().getFullYear() + 1;
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        nextYear,
        VehicleType.SEDAN,
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with invalid vehicle type", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        2024,
        "INVALID_TYPE" as any, // Invalid type
        FuelType.ELECTRIC
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "type")).toBe(true);
    });

    it("should fail validation with invalid fuel type", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        "INVALID_FUEL" as any // Invalid fuel type
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "fuelType")).toBe(true);
    });

    it("should fail validation with invalid status", () => {
      // Arrange
      const command = new CreateVehicleCommand(
        "1HGBH41JXMN109186",
        "ABC-1234",
        "Model S",
        "Tesla",
        2024,
        VehicleType.SEDAN,
        FuelType.ELECTRIC,
        "INVALID_STATUS" as any // Invalid status
      );

      // Act
      const result = validator.validate(command);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "status")).toBe(true);
    });
  });
});
