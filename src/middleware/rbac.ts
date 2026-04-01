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
    console.log('🔐 [requireRole] Iniciando verificación...');
    console.log('🔐 [requireRole] req.user:', req.user);
    console.log('🔐 [requireRole] allowedRoles:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ [requireRole] No hay usuario');
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    
    console.log(`🔐 [requireRole] Comparando: ${req.user.role} vs ${allowedRoles}`);
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ [requireRole] Rol ${req.user.role} no está permitido`);
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Rol ${req.user.role} no tiene permisos para esta acción` 
      });
    }
    
    console.log('✅ [requireRole] Rol permitido');
    
    // Para ADMIN y EMPLOYEE, deben tener pharmacy_id
    if (req.user.role !== 'SUPER_ADMIN' && !req.user.pharmacyId) {
      console.log('❌ [requireRole] Usuario sin farmacia asignada');
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario sin farmacia asignada. Contacte al administrador.' 
      });
    }
    
    console.log('✅ [requireRole] Verificación completa, acceso permitido');
    next();
  };
};

// Middleware para añadir filtro de farmacia automático
export const addPharmacyFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
    (req as any).pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
  }
  next();
};
