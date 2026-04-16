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
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // FORZAR PARA HEALTH-STATUS
    let finalAllowedRoles = [...allowedRoles];
    if (req.url.includes('health-status')) {
      finalAllowedRoles = ['SUPER_ADMIN'];
      console.log('🔧 FORZADO: health-status requiere SUPER_ADMIN');
    }
    
    console.log(`🔐 [requireRole] Ruta: ${req.url} | Roles:`, finalAllowedRoles);
    // ... resto del código
  };
};

// Middleware para añadir filtro de farmacia automático
export const addPharmacyFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
    (req as any).pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
  }
  next();
};
