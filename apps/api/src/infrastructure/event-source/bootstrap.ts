import "reflect-metadata";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Container } from "./container";
import { CommandBus } from "./command-bus";
import { QueryBus } from "./query-bus";
import { EventBus } from "./event-bus";
import { scanHandlers } from "./scanner";
import logger from "../configs/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupCQRS() {
  logger.info("🔍 Starting auto-discovery of handlers...");

  const srcDir = path.resolve(__dirname, "../..");
  const modulesDir = path.join(srcDir, "modules");

  Container.register(CommandBus, { useClass: CommandBus });
  Container.register(QueryBus, { useClass: QueryBus });
  Container.register(EventBus, { useClass: EventBus });

  let commandHandlerModules: any[] = [];
  let queryHandlerModules: any[] = [];
  let eventHandlerModules: any[] = [];

  if (fs.existsSync(modulesDir)) {
    const modules = fs.readdirSync(modulesDir);

    for (const module of modules) {
      const modulePath = path.join(modulesDir, module);
      const stat = fs.statSync(modulePath);

      if (stat.isDirectory()) {
        logger.info(`📂 Scanning module: ${module}`);

        const commandsDir = path.join(modulePath, "commands");
        if (fs.existsSync(commandsDir)) {
          const handlers = await scanHandlers(commandsDir);
          commandHandlerModules.push(...handlers);
        }

        const queriesDir = path.join(modulePath, "queries");
        if (fs.existsSync(queriesDir)) {
          const handlers = await scanHandlers(queriesDir);
          queryHandlerModules.push(...handlers);
        }

        const eventHandlersDir = path.join(modulePath, "event-handlers");
        if (fs.existsSync(eventHandlersDir)) {
          const handlers = await scanHandlers(eventHandlersDir);
          eventHandlerModules.push(...handlers);
        }
      }
    }
  }

  const allHandlerModules = [...commandHandlerModules, ...queryHandlerModules, ...eventHandlerModules];

  for (const { handlerClass } of allHandlerModules) {
    Container.register(handlerClass, { useClass: handlerClass });
  }

  const commandBus = Container.resolve(CommandBus);
  const queryBus = Container.resolve(QueryBus);
  const eventBus = Container.resolve(EventBus);

  const commandHandlers = commandHandlerModules.map(({ handlerClass }) => Container.resolve(handlerClass));
  const queryHandlers = queryHandlerModules.map(({ handlerClass }) => Container.resolve(handlerClass));
  const eventHandlers = eventHandlerModules.map(({ handlerClass }) => Container.resolve(handlerClass));

  commandBus.registerHandlers(commandHandlers);
  queryBus.registerHandlers(queryHandlers);
  eventBus.registerHandlers(eventHandlers);

  logger.info(`✅ CQRS with automatic handler discovery complete!`);
  logger.info(`   - ${commandHandlers.length} command handler(s)`);
  logger.info(`   - ${queryHandlers.length} query handler(s)`);
  logger.info(`   - ${eventHandlers.length} event handler(s)`);

  return { commandBus, queryBus, eventBus };
}
