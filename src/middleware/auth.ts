// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    // Verificar que el usuario aún existe en la BD
    const user = await prisma.users.findUnique({
      where: { id: req.session.userId },
      select: { id: true, is_active: true }  // ¡CORREGIDO! is_active
    });

    if (!user || !user.is_active) {  // ¡CORREGIDO! user.is_active
      req.session.destroy((err) => {});
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no válido' 
      });
    }

    next();
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
      if (!req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'No autenticado' 
        });
      }

      const user = await prisma.users.findUnique({
        where: { id: req.session.userId },
        select: { role: true }
      });

      if (!user || !user.role || !roles.includes(user.role)) {
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