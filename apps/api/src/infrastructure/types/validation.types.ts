export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface IValidator<T = any> {
  validate(data: T): Promise<ValidationResult> | ValidationResult;
}

export class ValidationException extends Error {
  constructor(
    public readonly errors: ValidationError[],
    message: string = "Validation failed"
  ) {
    super(message);
    this.name = "ValidationException";
  }
}
