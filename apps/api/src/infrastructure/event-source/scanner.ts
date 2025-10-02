import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import logger from "../configs/logger";

export interface HandlerModule {
  handlerClass: any;
  handlerType: "command" | "query" | "event";
}

export interface ValidatorModule {
  validatorClass: any;
  validatorType: "command" | "query";
}

export async function scanHandlers(directory: string): Promise<HandlerModule[]> {
  const handlers: HandlerModule[] = [];

  const scanDirectory = async (dir: string): Promise<void> => {
    if (!fs.existsSync(dir)) {
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (file.endsWith(".handler.ts") || file.endsWith(".handler.js")) {
        try {
          const fileUrl = pathToFileURL(fullPath).href;
          const module = await import(fileUrl);
          const handlerClass = Object.values(module)[0];

          let handlerType: "command" | "query" | "event" | undefined;

          if (fullPath.includes(path.sep + "commands" + path.sep)) {
            handlerType = "command";
          } else if (fullPath.includes(path.sep + "queries" + path.sep)) {
            handlerType = "query";
          } else if (
            fullPath.includes(path.sep + "events" + path.sep) ||
            fullPath.includes(path.sep + "event-handlers" + path.sep)
          ) {
            handlerType = "event";
          }

          if (handlerType) {
            handlers.push({ handlerClass, handlerType });
            logger.info(`📦 Discovered ${handlerType} handler: ${(handlerClass as any).name}`);
          }
        } catch (error) {
          logger.error(`Error importing handler from ${fullPath}:`, error);
        }
      }
    }
  };

  await scanDirectory(directory);
  return handlers;
}

export async function scanValidators(directory: string): Promise<ValidatorModule[]> {
  const validators: ValidatorModule[] = [];

  const scanDirectory = async (dir: string): Promise<void> => {
    if (!fs.existsSync(dir)) {
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (file.endsWith(".validator.ts") || file.endsWith(".validator.js")) {
        try {
          const fileUrl = pathToFileURL(fullPath).href;
          const module = await import(fileUrl);
          const validatorClass = Object.values(module)[0];

          let validatorType: "command" | "query" | undefined;

          if (fullPath.includes(path.sep + "commands" + path.sep)) {
            validatorType = "command";
          } else if (fullPath.includes(path.sep + "queries" + path.sep)) {
            validatorType = "query";
          }

          if (validatorType) {
            validators.push({ validatorClass, validatorType });
            logger.info(`📋 Discovered ${validatorType} validator: ${(validatorClass as any).name}`);
          }
        } catch (error) {
          logger.error(`Error importing validator from ${fullPath}:`, error);
        }
      }
    }
  };

  await scanDirectory(directory);
  return validators;
}
