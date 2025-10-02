import { singleton } from "./container";
import { getCommandFromHandler } from "../decorators/command-handler";
import { getTargetFromValidator } from "../decorators/validator";
import { IValidator, ValidationException } from "../types/validation.types";
import logger from "../configs/logger";

export interface ICommandHandler<T = any> {
  execute(command: T): Promise<any>;
}

@singleton()
export class CommandBus {
  private handlers: Map<string, ICommandHandler> = new Map();
  private validators: Map<string, IValidator> = new Map();

  registerHandlers(handlerInstances: any[]) {
    for (const handler of handlerInstances) {
      const command = getCommandFromHandler(handler);
      if (command) {
        this.handlers.set(command.name, handler);
        logger.info(`✅ Registered CommandHandler: ${command.name} → ${handler.constructor.name}`);
      }
    }
  }

  register(commandName: string, handler: ICommandHandler) {
    this.handlers.set(commandName, handler);
  }

  registerValidators(validatorInstances: any[]) {
    for (const validator of validatorInstances) {
      const command = getTargetFromValidator(validator);
      if (command) {
        this.validators.set(command.name, validator);
        logger.info(`✅ Registered CommandValidator: ${command.name} → ${validator.constructor.name}`);
      }
    }
  }

  async execute(command: any): Promise<any> {
    const commandName = command.constructor.name;

    const validator = this.validators.get(commandName);
    if (validator) {
      logger.info(`🔍 Validating command: ${commandName}`);
      const result = await validator.validate(command);
      if (!result.isValid) {
        logger.warn(`❌ Validation failed for command: ${commandName}`, result.errors);
        throw new ValidationException(result.errors);
      }
      logger.info(`✓ Validation passed for command: ${commandName}`);
    }

    const handler = this.handlers.get(commandName);
    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    logger.info(`⚡ Executing command: ${commandName}`);
    return await handler.execute(command);
  }
}
