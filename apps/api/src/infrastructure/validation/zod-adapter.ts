import { z } from "zod";
import { ValidationResult, ValidationError } from "../types/validation.types";

/**
 * Adapter to convert Zod validation results to our ValidationResult format
 */
export class ZodAdapter {
  /**
   * Validates data using a Zod schema and converts the result to ValidationResult
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
      };
    }

    const errors: ValidationError[] = result.error.errors.map((err: z.ZodIssue) => ({
      field: err.path.join("."),
      message: err.message,
      value: err.path.reduce((obj: any, key: string | number) => obj?.[key], data),
    }));

    return {
      isValid: false,
      errors,
    };
  }

  /**
   * Creates a successful validation result
   */
  static success(): ValidationResult {
    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Creates a failed validation result with custom errors
   */
  static fail(errors: ValidationError[]): ValidationResult {
    return {
      isValid: false,
      errors,
    };
  }
}
