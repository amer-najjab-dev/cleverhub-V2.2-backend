// src/middleware/region.middleware.ts
import { Request, Response, NextFunction } from 'express';

// Extender Request localmente (solo para este archivo)
interface CustomRequest extends Request {
  region?: string;
}

export const regionMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const region = (req.headers as any)['x-region'] || 'MA';
  req.region = region;
  console.log(`📥 Petición a ${req.path} desde región: ${region}`);
  next();
};