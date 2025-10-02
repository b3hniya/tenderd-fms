import { GetMaintenanceByIdValidator } from "../get-maintenance-by-id.validator";
import { GetMaintenanceByIdQuery } from "../get-maintenance-by-id.query";

describe("GetMaintenanceByIdValidator", () => {
  let validator: GetMaintenanceByIdValidator;

  beforeEach(() => {
    validator = new GetMaintenanceByIdValidator();
  });

  describe("validate", () => {
    it("should pass validation with valid id", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439011");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with empty id", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "id")).toBe(true);
      expect(result.errors.some((e) => e.message.includes("required"))).toBe(true);
    });

    it("should pass validation with various valid ObjectId formats", () => {
      // Arrange
      const validIds = [
        "507f1f77bcf86cd799439011",
        "5f8d0d55b54764421b7156c9",
        "60b8d295f4f8b4f8b4f8b4f8",
        "61234567890abcdef0123456",
      ];

      // Act & Assert
      for (const id of validIds) {
        const query = new GetMaintenanceByIdQuery(id);
        const result = validator.validate(query);
        expect(result.isValid).toBe(true);
      }
    });

    it("should pass validation with id containing only lowercase letters", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("abcdef0123456789abcdef01");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with id containing numbers", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("123456789012345678901234");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should pass validation with mixed alphanumeric id", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("a1b2c3d4e5f6a1b2c3d4e5f6");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should handle validation of multiple queries", () => {
      // Arrange
      const query1 = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439011");
      const query2 = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439012");

      // Act
      const result1 = validator.validate(query1);
      const result2 = validator.validate(query2);

      // Assert
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });

    it("should pass validation with minimum length id (1 character)", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("a");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should return specific error message for empty id", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("Maintenance ID is required");
    });

    it("should validate only the id field", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439011");

      // Act
      const result = validator.validate(query);

      // Assert
      if (!result.isValid) {
        result.errors.forEach((error) => {
          expect(error.field).toBe("id");
        });
      }
    });

    it("should pass validation with whitespace id (not trimmed by validator)", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("   ");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should validate successfully for typical MongoDB ObjectId", () => {
      // Arrange
      const query = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439011");

      // Act
      const result = validator.validate(query);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle sequential validation calls", () => {
      // Arrange
      const validQuery = new GetMaintenanceByIdQuery("507f1f77bcf86cd799439011");
      const invalidQuery = new GetMaintenanceByIdQuery("");

      // Act
      const result1 = validator.validate(validQuery);
      const result2 = validator.validate(invalidQuery);
      const result3 = validator.validate(validQuery);

      // Assert
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(true);
    });
  });
});
