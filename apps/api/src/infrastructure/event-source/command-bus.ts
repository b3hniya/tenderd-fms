import { singleton } from "./container";
import { getCommandFromHandler } from "../decorators/command-handler";
import logger from "../configs/logger";

export interface ICommandHandler<T = any> {
  execute(command: T): Promise<any>;
}

@singleton()
export class CommandBus {
  private handlers: Map<string, ICommandHandler> = new Map();

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

  async execute(command: any): Promise<any> {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    logger.info(`⚡ Executing command: ${commandName}`);
    return await handler.execute(command);
  }
}


