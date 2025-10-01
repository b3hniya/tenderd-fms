import { singleton } from "./container";
import { getQueryFromHandler } from "../decorators/query-handler";
import logger from "../configs/logger";

export interface IQueryHandler<T = any> {
  execute(query: T): Promise<any>;
}

@singleton()
export class QueryBus {
  private handlers: Map<string, IQueryHandler> = new Map();

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

  async execute(query: any): Promise<any> {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    logger.info(`⚡ Executing query: ${queryName}`);
    return await handler.execute(query);
  }
}


