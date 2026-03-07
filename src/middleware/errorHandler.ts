import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Error del servidor",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
