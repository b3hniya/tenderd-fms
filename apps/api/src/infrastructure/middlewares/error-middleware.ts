import { Request, Response, NextFunction } from "express";
import logger from "../configs/logger";

export const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === "CastError") {
    logger.error(`CastError - ${error.message} - ${req.method} - ${req.originalUrl} - IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }

  const status = error?.statusCode ?? 500;
  const message = error?.message ?? "Something went wrong";

  logger.error(`Error ${status} - ${message} - ${req.method} - ${req.originalUrl} - IP: ${req.ip}`);

  res.status(status).json({
    success: false,
    error: message,
  });
};
