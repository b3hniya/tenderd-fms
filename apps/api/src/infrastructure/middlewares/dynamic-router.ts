import fs from "fs";
import path from "path";
import { Router } from "express";
import { pathToFileURL } from "url";
import chalk from "chalk";
import { toKebabCase } from "../utils/string-util";

const MODE = process.env.MODE || "DEV";

/**
 * Dynamically loads controllers from modules/ * /controllers pattern and attaches them to a router.
 * @param modulesDir The modules directory to scan for controllers.
 * @returns A router with all the controllers attached.
 * @example
 * const router = await dynamicRouter(path.join(__dirname, "modules"));
 * app.use("/api", router);
 */
const dynamicRouter = async (modulesDir: string): Promise<Router> => {
  const router = Router();

  const loadModuleControllers = async (moduleDir: string) => {
    const moduleName = path.basename(moduleDir);
    const controllersDir = path.join(moduleDir, "controllers");

    if (!fs.existsSync(controllersDir)) {
      if (MODE === "DEV") {
        console.log(chalk.yellow(`No controllers directory found in module: ${moduleName}`));
      }
      return;
    }

    const loadControllers = async (dir: string, moduleName: string) => {
      const relativePath = path.relative(controllersDir, dir).replace(/\\/g, "/");

      fs.readdirSync(dir).forEach(async (item) => {
        const fullPath = path.join(dir, item);

        if (fs.statSync(fullPath).isDirectory()) {
          await loadControllers(fullPath, moduleName);
        } else if (item.endsWith(".controller.ts")) {
          try {
            const controller = await import(pathToFileURL(fullPath).href);

            const controllerName = toKebabCase(item.replace(".controller.ts", ""));

            const shouldOmitControllerName = controllerName === moduleName;

            const routePath = shouldOmitControllerName
              ? relativePath
                ? `/${moduleName}/${relativePath}`
                : `/${moduleName}`
              : relativePath
                ? `/${moduleName}/${relativePath}/${controllerName}`
                : `/${moduleName}/${controllerName}`;

            if (controller.put) router.put(routePath, controller.put);
            if (controller.get) router.get(routePath, controller.get);
            if (controller.post) router.post(routePath, controller.post);
            if (controller.patch) router.patch(routePath, controller.patch);
            if (controller.delete) router.delete(routePath, controller.delete);

            if (MODE === "DEV") {
              const methods: string[] = [];

              if (controller.put) methods.push("PUT");
              if (controller.get) methods.push("GET");
              if (controller.post) methods.push("POST");
              if (controller.patch) methods.push("PATCH");
              if (controller.delete) methods.push("DELETE");

              // Log the route for debugging
              if (methods.length > 0) {
                console.log(
                  chalk.green(`Module: ${moduleName} - Route: ${routePath} with methods: ${methods.join(", ")}`)
                );
              } else {
                console.log(chalk.yellow(`No methods found for route: ${routePath} in module: ${moduleName}`));
              }
            }
          } catch (error) {
            console.error(chalk.red(`Error loading controller: ${fullPath}`));
            console.error(error);
          }
        }
      });
    };

    await loadControllers(controllersDir, moduleName);
  };

  if (fs.existsSync(modulesDir)) {
    const modules = fs.readdirSync(modulesDir);

    for (const module of modules) {
      const modulePath = path.join(modulesDir, module);
      if (fs.statSync(modulePath).isDirectory()) {
        await loadModuleControllers(modulePath);
      }
    }
  } else {
    console.error(chalk.red(`Modules directory not found: ${modulesDir}`));
  }

  return router;
};

export default dynamicRouter;
