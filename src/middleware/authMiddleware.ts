import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  role: "admin" | "pharmacist" | "assistant";
}

/**
 * Middleware de autenticación
 * Verifica token JWT
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Inyectamos el usuario en la request
    (req as any).user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

/**
 * Middleware de autorización por roles
 */
export const authorize =
  (...roles: Array<"admin" | "pharmacist" | "assistant">) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Permisos insuficientes" });
    }

    next();
  };
