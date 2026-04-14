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
  // LOG CRÍTICO - Ver qué recibe la función
  console.log(`[RBAC DEBUG] ⚠️ requireRole INIT - allowedRoles recibido:`, allowedRoles);
  console.log(`[RBAC DEBUG] ⚠️ requireRole INIT - stack:`, new Error().stack);
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(`[RBAC DEBUG] Path: ${req.path} | URL: ${req.url} | Roles:`, allowedRoles);
    console.log('🔐 [requireRole] Iniciando...');
    console.log('🔐 [requireRole] req.user:', req.user);
    console.log('🔐 [requireRole] allowedRoles:', allowedRoles);
    
    if (!req.user) {
      console.log('❌ [requireRole] No hay usuario');
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    
    // FUERZA EMPLOYEE para rutas de dashboard y sales
    let finalAllowedRoles = [...allowedRoles];
    if (req.url.includes('/dashboard') || req.url.includes('/sales')) {
      if (!finalAllowedRoles.includes('EMPLOYEE')) {
        finalAllowedRoles.push('EMPLOYEE');
        console.log(`[RBAC DEBUG] 🔧 FORZADO: Se añadió EMPLOYEE a ${req.url}`);
      }
    }
    
    const userRole = req.user.role.toLowerCase();
    const normalizedAllowed = finalAllowedRoles.map(r => r.toLowerCase());
    
    console.log('🔐 [requireRole] userRole (normalizado):', userRole);
    console.log('🔐 [requireRole] normalizedAllowed:', normalizedAllowed);
    
    if (!normalizedAllowed.includes(userRole)) {
      console.log(`❌ [requireRole] Rol ${req.user.role} no permitido`);
      return res.status(403).json({ 
        success: false, 
        message: `No autorizado. Se requiere uno de estos roles: ${finalAllowedRoles.join(', ')}` 
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
};
