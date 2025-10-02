import { singleton } from "./container";
import { getQueryFromHandler } from "../decorators/query-handler";
import { getTargetFromValidator } from "../decorators/validator";
import { IValidator, ValidationException } from "../types/validation.types";
import logger from "../configs/logger";

export interface IQueryHandler<T = any> {
  execute(query: T): Promise<any>;
}

@singleton()
export class QueryBus {
  private handlers: Map<string, IQueryHandler> = new Map();
  private validators: Map<string, IValidator> = new Map();

  registerHandlers(handlerInstances: any[]) {
    for (const handler of handlerInstances) {
      const query = getQueryFromHandler(handler);
      if (query) {
        this.handlers.set(query.name, handler);
        logger.info(`✅ Registered QueryHandler: ${query.name} → ${handler.constructor.name}`);
      }
    }
  }

  register(queryName: string, handler: IQueryHandler) {
    this.handlers.set(queryName, handler);
  }

  registerValidators(validatorInstances: any[]) {
    for (const validator of validatorInstances) {
      const query = getTargetFromValidator(validator);
      if (query) {
        this.validators.set(query.name, validator);
        logger.info(`✅ Registered QueryValidator: ${query.name} → ${validator.constructor.name}`);
      }
    }
  }

  async execute(query: any): Promise<any> {
    const queryName = query.constructor.name;

    const validator = this.validators.get(queryName);
    if (validator) {
      logger.info(`🔍 Validating query: ${queryName}`);
      const result = await validator.validate(query);
      if (!result.isValid) {
        logger.warn(`❌ Validation failed for query: ${queryName}`, result.errors);
        throw new ValidationException(result.errors);
      }
      logger.info(`✓ Validation passed for query: ${queryName}`);
    }

    const handler = this.handlers.get(queryName);
    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    logger.info(`⚡ Executing query: ${queryName}`);
    return await handler.execute(query);
  }
}
