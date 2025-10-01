import { singleton } from "./container";
import { getEventFromHandler } from "../decorators/event-handler";
import logger from "../configs/logger";

export interface IEventHandler<T = any> {
  handle(event: T): Promise<void>;
}

@singleton()
export class EventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();

  registerHandlers(handlerInstances: any[]) {
    for (const handler of handlerInstances) {
      const event = getEventFromHandler(handler);
      if (event) {
        const eventName = event.name;
        const existingHandlers = this.handlers.get(eventName) || [];
        existingHandlers.push(handler);
        this.handlers.set(eventName, existingHandlers);
        logger.info(`✅ Registered EventHandler: ${eventName} → ${handler.constructor.name}`);
      }
    }
  }

  subscribe(eventName: string, handler: IEventHandler) {
    const existingHandlers = this.handlers.get(eventName) || [];
    existingHandlers.push(handler);
    this.handlers.set(eventName, existingHandlers);
  }

  async publish(event: any): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName) || [];

    logger.info(`📢 Publishing event: ${eventName} to ${handlers.length} handler(s)`);

    const promises = handlers.map(async (handler) => {
      try {
        await handler.handle(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventName}:`, error);
      }
    });

    await Promise.all(promises);
  }
}


