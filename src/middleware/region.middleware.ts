import { Request, Response, NextFunction } from 'express';

// Extender el tipo Request para incluir region
declare global {
  namespace Express {
    interface Request {
      region: string;
    }
  }
}

// Middleware para extraer la región del header
export const regionMiddleware = (req: Request, res: Response, next: 
NextFunction) => {
  // Leer región del header 'X-Region', por defecto 'MA' (Marruecos)
  const region = req.headers['x-region'] as string || 'MA';
  
  // Validar que la región sea válida (opcional)
  const validRegions = ['MA', 'FR', 'ES', 'TN', 'DZ'];
  if (!validRegions.includes(region)) {
    console.warn(`⚠️ Región no válida recibida: ${region}, usando MA por 
defecto`);
    req.region = 'MA';
  } else {
    req.region = region;
  }
  
  // Log para debugging
  console.log(`📥 Petición a ${req.path} desde región: ${req.region}`);
  
  next();
};
