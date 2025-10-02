import { GetMaintenanceHistoryValidator } from "../get-maintenance-history.validator";
import { GetMaintenanceHistoryQuery } from "../get-maintenance-history.query";
import { MaintenanceStatus } from "@tenderd-fms/core-types";

describe("GetMaintenanceHistoryValidator", () => {
  let validator: GetMaintenanceHistoryValidator;

  beforeEach(() => {
    validator = new GetMaintenanceHistoryValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid vehicleId only", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with empty vehicleId", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "vehicleId")).toBe(true);
    });

    it("should pass validation with all parameters", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        MaintenanceStatus.COMPLETED,
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        1,
        10
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid status", () => {
      // Arrange
      const statuses = [
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.CANCELLED,
      ];

      // Act & Assert
      for (const status of statuses) {
        const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", status);
        const result = validator.validate(query);
        expect(result.isValid).toBe(true);
      }
    });

    it("should fail validation with invalid status", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", "INVALID_STATUS" as any);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "status")).toBe(true);
    });

    it("should pass validation with valid startDate", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, new Date("2025-01-01"));

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid endDate", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        undefined,
        undefined,
        new Date("2025-01-31")
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with both startDate and endDate", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        undefined,
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with valid page number", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 5);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with page less than 1", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 0);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "page")).toBe(true);
    });

    it("should fail validation with negative page", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, -1);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "page")).toBe(true);
    });

    it("should pass validation with valid limit", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 50);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with limit less than 1", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 0);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "limit")).toBe(true);
    });

    it("should fail validation with negative limit", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, -10);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "limit")).toBe(true);
    });

    it("should fail validation with limit exceeding maximum", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 101);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "limit")).toBe(true);
    });

    it("should pass validation with limit at maximum (100)", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 100);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with minimum valid values", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 1);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with default pagination values", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1, 10);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with only optional status", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", MaintenanceStatus.SCHEDULED);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with only optional dates", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        undefined,
        new Date("2025-01-01"),
        new Date("2025-01-31")
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate multiple errors at once", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "", // Invalid vehicleId
        "INVALID" as any, // Invalid status
        undefined,
        undefined,
        0, // Invalid page
        -5 // Invalid limit
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("should pass validation with future dates", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        undefined,
        new Date("2026-01-01"),
        new Date("2026-12-31")
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with past dates", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery(
        "507f1f77bcf86cd799439011",
        undefined,
        new Date("2020-01-01"),
        new Date("2020-12-31")
      );

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with same startDate and endDate", () => {
      // Arrange
      const sameDate = new Date("2025-01-15");
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, sameDate, sameDate);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with large page number", () => {
      // Arrange
      const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", undefined, undefined, undefined, 1000);

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should handle sequential validation calls", () => {
      // Arrange
      const validQuery = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011");
      const invalidQuery = new GetMaintenanceHistoryQuery("");

      // Act
      const result1 = validator.validate(validQuery);
      const result2 = validator.validate(invalidQuery);
      const result3 = validator.validate(validQuery);

      // Assert
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(true);
    });

    it("should pass validation with all statuses", () => {
      // Arrange
      const statuses = [
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.CANCELLED,
      ];

      // Act & Assert
      for (const status of statuses) {
        const query = new GetMaintenanceHistoryQuery("507f1f77bcf86cd799439011", status);
        const result = validator.validate(query);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });
});
