// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

// SECRETO FIJO - usar el mismo en todos lados
const JWT_SECRET = 'cleverhub-secret-key-2026';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  pharmacyId: number | null;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const extractToken = (req: any): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};