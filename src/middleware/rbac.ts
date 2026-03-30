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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' 
});
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Rol ${req.user.role} no tiene permisos para 
esta acción` 
      });
    }
    
    // Para ADMIN y EMPLOYEE, deben tener pharmacy_id
    if (req.user.role !== 'SUPER_ADMIN' && !req.user.pharmacyId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario sin farmacia asignada. Contacte al administrador.' 
      });
    }
    
    next();
  };
};

// Middleware para añadir filtro de farmacia automático
export const addPharmacyFilter = (req: AuthRequest, res: Response, next: 
NextFunction) => {
  if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
    (req as any).pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
  }
  next();
};
