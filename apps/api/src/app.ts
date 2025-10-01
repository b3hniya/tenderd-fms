import "reflect-metadata";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";
import dynamicRouter from "./infrastructure/middlewares/dynamic-router";
import { requestLogger } from "./infrastructure/middlewares/request-logger";
import { errorMiddleware } from "./infrastructure/middlewares/error-middleware";
import { swaggerSpec } from "./infrastructure/configs/swagger";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { setupCQRS } from "./infrastructure/event-source/bootstrap";

const origin = process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : "*";

const methods = "GET,POST,PUT,DELETE";

const allowedHeaders = "Content-Type,Authorization";

const credentials = true;

const corsOptions = {
  origin,
  methods,
  credentials,
  allowedHeaders,
};

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const createApp = async (): Promise<Express> => {
  const app = express();

  app.use(helmet());

  app.use(cors(corsOptions));

  app.use(requestLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const cqrs = await setupCQRS();
  (global as any).cqrs = cqrs;

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "tenderd FMS API Documentation",
    })
  );

  const routes = await dynamicRouter(path.join(__dirname, "modules"));

  app.use("/api", routes);

  app.use(errorMiddleware);

  return app;
};

export default createApp;
