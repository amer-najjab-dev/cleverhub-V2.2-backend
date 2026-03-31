// src/utils/jwt.ts
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cleverhub-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
  pharmacyId: number | null;  // ✅ Puede ser null para SUPER_ADMIN
}

export const generateToken = (payload: TokenPayload): string => {
  try {
    console.log('🔐 [generateToken] Generando token para usuario:', { 
      id: payload.id, 
      email: payload.email, 
      role: payload.role,
      pharmacyId: payload.pharmacyId 
    });
    
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    const token = jwt.sign(payload, JWT_SECRET, options);
    console.log('✅ [generateToken] Token generado exitosamente');
    return token;
  } catch (error) {
    console.error('❌ [generateToken] Error generando token:', error);
    throw error;
  }
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    console.log('🔐 [verifyToken] Iniciando verificación de token...');
    console.log('🔐 [verifyToken] Token recibido:', token.substring(0, 50) + '...');
    console.log('🔐 [verifyToken] Usando secret:', JWT_SECRET.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log('✅ [verifyToken] Token válido:', { 
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
  
  // Verificar Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('✅ [extractToken] Token encontrado en Authorization header');
    return token;
  }
  
  // Verificar query parameter (opcional)
  const queryToken = req.query.token;
  if (queryToken && typeof queryToken === 'string') {
    console.log('✅ [extractToken] Token encontrado en query params');
    return queryToken;
  }
  
  // Verificar cookie (opcional)
  const cookieToken = req.cookies?.token;
  if (cookieToken) {
    console.log('✅ [extractToken] Token encontrado en cookies');
    return cookieToken;
  }
  
  console.log('⚠️ [extractToken] No se encontró token en ninguna fuente');
  return null;
};

// Función para decodificar token sin verificar (útil para depuración)
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    console.log('🔐 [decodeToken] Decodificando token sin verificar...');
    const decoded = jwt.decode(token) as JwtPayload;
    if (decoded) {
      console.log('✅ [decodeToken] Token decodificado:', { 
        id: decoded.id, 
        email: decoded.email, 
        role: decoded.role,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'
      });
    }
    return decoded;
  } catch (error) {
    console.error('❌ [decodeToken] Error decodificando token:', error);
    return null;
  }
};

// Función para refrescar token
export const refreshToken = async (oldToken: string): Promise<string | null> => {
  try {
    console.log('🔐 [refreshToken] Intentando refrescar token...');
    const decoded = verifyToken(oldToken);
    
    // Generar nuevo token con la misma información
    const newToken = generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      pharmacyId: decoded.pharmacyId
    });
    
    console.log('✅ [refreshToken] Token refrescado exitosamente');
    return newToken;
  } catch (error) {
    console.error('❌ [refreshToken] Error refrescando token:', error);
    return null;
  }
};