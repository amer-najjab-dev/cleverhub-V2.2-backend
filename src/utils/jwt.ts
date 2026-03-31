// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'cleverhub-secret-key-2026';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  pharmacyId: number | null;
}

export const generateToken = (payload: TokenPayload): string => {
  console.log('🔐 [generateToken] Generando token con payload:', {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    pharmacyId: payload.pharmacyId
  });
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  console.log('✅ [generateToken] Token generado:', token.substring(0, 50) + '...');
  return token;
};

export const verifyToken = (token: string): TokenPayload => {
  console.log('🔐 [verifyToken] Verificando token:', token.substring(0, 50) + '...');
  console.log('🔐 [verifyToken] Usando JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log('✅ [verifyToken] Token verificado exitosamente:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      pharmacyId: decoded.pharmacyId
    });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ [verifyToken] Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ [verifyToken] Token inválido:', error.message);
    } else {
      console.error('❌ [verifyToken] Error verificando token:', error);
    }
    throw error;
  }
};

export const extractToken = (req: any): string | null => {
  console.log('🔐 [extractToken] Extrayendo token de headers...');
  const authHeader = req.headers.authorization;
  console.log('🔐 [extractToken] Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'NO HEADER');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('✅ [extractToken] Token extraído:', token.substring(0, 50) + '...');
    return token;
  }
  console.log('❌ [extractToken] No se pudo extraer token - formato inválido o ausente');
  return null;
};

export type { TokenPayload };