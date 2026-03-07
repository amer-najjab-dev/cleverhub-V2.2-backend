import { Request, Response, NextFunction } from 'express';

// Extender el tipo Request para incluir la sesión
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
    userEmail: string;
  }
}

// Middleware para requerir autenticación
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  next();
};

// Middleware para requerir rol específico
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    const userRole = req.session.userRole;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para esta acción'
      });
    }
    
    next();
  };
};