// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { verifyToken, extractToken } from '../utils/jwt';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Primero intentar con JWT
    const token = extractToken(req);
    
    if (token) {
      const payload = verifyToken(token);
      
      if (payload) {
        (req as any).user = payload;
        return next();
      }
    }
    
    // Fallback a sesión por cookie (para compatibilidad)
    if (req.session.userId) {
      const user = await prisma.users.findUnique({
        where: { id: req.session.userId },
        select: { id: true, email: true, role: true, is_active: true }
      });

      if (user && user.is_active) {
        (req as any).user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user'
        };
        return next();
      }
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'No autenticado' 
    });
  } catch (error) {
    console.error('Error en auth middleware:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'No autenticado' 
        });
      }

      if (!user.role || !roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'No autorizado' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error de autorización' 
      });
    }
  };
};