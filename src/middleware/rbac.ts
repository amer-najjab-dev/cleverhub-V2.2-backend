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
    
    let userRole = req.user.role;
    let mappedRole = userRole;
    
    // Mapear SUPER_ADMIN a los roles que necesita la ruta
    if (userRole === 'SUPER_ADMIN') {
      // Si la ruta requiere ADMIN o EMPLOYEE, mapear a ese rol
      if (allowedRoles.includes('ADMIN')) {
        console.log('🔄 [requireRole] Mapeando SUPER_ADMIN a ADMIN');
        mappedRole = 'ADMIN';
      } else if (allowedRoles.includes('EMPLOYEE')) {
        console.log('🔄 [requireRole] Mapeando SUPER_ADMIN a EMPLOYEE');
        mappedRole = 'EMPLOYEE';
      } else {
        console.log('🔐 [requireRole] Manteniendo SUPER_ADMIN');
      }
    }
    
    const normalizedUserRole = mappedRole.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    
    console.log('🔐 [requireRole] Rol original:', userRole);
    console.log('🔐 [requireRole] Rol mapeado:', mappedRole);
    console.log('🔐 [requireRole] Roles permitidos:', allowedRoles);
    
    if (!normalizedAllowed.includes(normalizedUserRole)) {
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
