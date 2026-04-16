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
    console.log('🔐 [requireRole] Iniciando...');
    console.log('🔐 [requireRole] req.user:', req.user);
    console.log('🔐 [requireRole] allowedRoles:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ [requireRole] No hay usuario');
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    
    // NORMALIZAR: convertir todo a MAYÚSCULAS para comparar
    const userRole = req.user.role.toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    
    console.log('🔐 [requireRole] Rol normalizado (mayúsculas):', userRole);
    console.log('🔐 [requireRole] Roles permitidos (mayúsculas):', normalizedAllowed);
    
    // Si es SUPER_ADMIN, acceso garantizado
    if (userRole === 'SUPER_ADMIN') {
      console.log('✅ [requireRole] SUPER_ADMIN acceso garantizado');
      return next();
    }
    
    if (!normalizedAllowed.includes(userRole)) {
      console.log(`❌ [requireRole] Rol ${req.user.role} no permitido`);
      return res.status(403).json({ 
        success: false, 
        message: `No autorizado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    console.log('✅ [requireRole] Acceso permitido');
    next();
  };
};

// Middleware para añadir filtro de farmacia automático
export const addPharmacyFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.pharmacyId && req.user.role !== 'SUPER_ADMIN') {
    (req as any).pharmacyFilter = { pharmacy_id: req.user.pharmacyId };
  }
  next();
};// force deploy Jeu 16 avr 2026 18:00:30 +01
