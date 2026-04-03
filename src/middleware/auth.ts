// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { verifyToken, extractToken } from '../utils/jwt';

// Extender el tipo Request correctamente
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      email: string;
      role: string;
      pharmacyId: number | null;
    };
    pharmacyFilter?: {
      pharmacy_id?: number;
    };
  }
}

// No declarar session aquí porque ya está en express-session

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 [requireAuth] Iniciando autenticación...');
    console.log(`📝 [requireAuth] Método: ${req.method}, Ruta: ${req.path}`);
    
    // Primero intentar con JWT
    const token = extractToken(req);
    console.log('🔐 [requireAuth] Token extraído:', token ? `${token.substring(0, 30)}...` : 'NO_TOKEN');
    
    if (token) {
      try {
        const payload = verifyToken(token);
        console.log('🔐 [requireAuth] Token verificado. Payload:', { 
          id: payload.id, 
          email: payload.email, 
          role: payload.role,
          pharmacyId: payload.pharmacyId
        });
        
        // Verificar que el usuario aún existe y está activo
        const user = await prisma.users.findUnique({
          where: { id: payload.id },
          select: { id: true, is_active: true, role: true, pharmacy_id: true }
        });
        
        if (!user || !user.is_active) {
          console.log('❌ [requireAuth] Usuario no existe o está inactivo');
          return res.status(401).json({ success: false, message: 'Usuario no válido' });
        }
        
        req.user = {
          id: payload.id,
          email: payload.email,
          role: user.role,
          pharmacyId: user.pharmacy_id
        };
        console.log('✅ [requireAuth] Usuario autenticado con JWT');
        return next();
      } catch (jwtError) {
        console.error('❌ [requireAuth] Error verificando JWT:', jwtError);
      }
    }
    
    // Fallback a sesión por cookie
    console.log('🔐 [requireAuth] Intentando fallback con sesión...');
    if (req.session && req.session.userId) {
      console.log(`📝 [requireAuth] Session userId: ${req.session.userId}`);
      
      const user = await prisma.users.findUnique({
        where: { id: req.session.userId },
        select: { 
          id: true, 
          email: true, 
          role: true, 
          is_active: true,
          pharmacy_id: true
        }
      });

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'employee',
          pharmacyId: user.pharmacy_id
        };
        console.log('✅ [requireAuth] Usuario autenticado por sesión:', {
          id: user.id,
          email: user.email,
          role: user.role,
          pharmacyId: user.pharmacy_id
        });
        return next();
      } else if (user && !user.is_active) {
        console.log('❌ [requireAuth] Usuario inactivo');
        return res.status(401).json({ success: false, message: 'Usuario inactivo' });
      }
    } else {
      console.log('📝 [requireAuth] No hay sesión activa');
    }
    
    console.log('❌ [requireAuth] No se pudo autenticar al usuario');
    return res.status(401).json({ success: false, message: 'No autenticado' });
  } catch (error) {
    console.error('❌ [requireAuth] Error inesperado:', error);
    return res.status(500).json({ success: false, message: 'Error de autenticación' });
  }
};

// Middleware para verificar que el usuario tiene una farmacia asignada
export const requirePharmacy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }
    
    // SUPER_ADMIN no necesita farmacia asignada
    if (user.role === 'SUPER_ADMIN') {
      console.log('✅ [requirePharmacy] SUPER_ADMIN, acceso permitido sin farmacia');
      return next();
    }
    
    if (!user.pharmacyId) {
      console.log('❌ [requirePharmacy] Usuario sin farmacia asignada');
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario sin farmacia asignada' 
      });
    }
    
    console.log(`✅ [requirePharmacy] Usuario con farmacia ID: ${user.pharmacyId}`);
    next();
  } catch (error) {
    console.error('❌ [requirePharmacy] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error verificando farmacia' 
    });
  }
};

// Middleware para añadir el filtro de farmacia a las consultas
export const addPharmacyFilter = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    console.log('⚠️ [addPharmacyFilter] No hay usuario autenticado');
    req.pharmacyFilter = {};
    return next();
  }
  
  // SUPER_ADMIN no tiene filtro de farmacia
  if (user.role === 'SUPER_ADMIN') {
    console.log('🔍 [addPharmacyFilter] SUPER_ADMIN - Sin filtro de farmacia');
    req.pharmacyFilter = {};
    return next();
  }
  
  // Para ADMIN y EMPLOYEE, añadir filtro por pharmacy_id
  if (user.pharmacyId) {
    console.log(`🔍 [addPharmacyFilter] Añadiendo filtro para pharmacy_id: ${user.pharmacyId}`);
    req.pharmacyFilter = {
      pharmacy_id: user.pharmacyId
    };
  } else {
    console.log('⚠️ [addPharmacyFilter] Usuario sin pharmacy_id');
    req.pharmacyFilter = {};
  }
  
  next();
};