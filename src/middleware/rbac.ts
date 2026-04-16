import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
}

export const requireRole = (allowedRoles: string[]) => {
  console.log(`🔧 [requireRole INIT] Ruta configurada con:`, allowedRoles);
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(`🔧 [requireRole EJECUTANDO] URL: ${req.url}, allowedRoles originales:`, allowedRoles);
    
    // FORZAR PARA HEALTH-STATUS
    let finalAllowedRoles = [...allowedRoles];
    if (req.url.includes('health-status')) {
      finalAllowedRoles = ['SUPER_ADMIN'];
      console.log('🔧 FORZADO: health-status requiere SUPER_ADMIN');
    }
    
    console.log(`🔧 [requireRole] Roles finales:`, finalAllowedRoles);
    // ... resto
  };
};

// Middleware para añadir filtro de farmacia automático
export const addPharmacyFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
    (req as any).pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
  }
  next();
};
