"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.decodeToken = exports.extractToken = exports.verifyToken = exports.generateToken = void 0;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'cleverhub-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const generateToken = (payload) => {
    try {
        console.log('🔐 [generateToken] Generando token para usuario:', {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            pharmacyId: payload.pharmacyId
        });
        const options = { expiresIn: JWT_EXPIRES_IN };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
        console.log('✅ [generateToken] Token generado exitosamente');
        return token;
    }
    catch (error) {
        console.error('❌ [generateToken] Error generando token:', error);
        throw error;
    }
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        console.log('🔐 [verifyToken] Iniciando verificación de token...');
        console.log('🔐 [verifyToken] Token recibido:', token.substring(0, 50) + '...');
        console.log('🔐 [verifyToken] Usando secret:', JWT_SECRET.substring(0, 10) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('✅ [verifyToken] Token válido:', {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            pharmacyId: decoded.pharmacyId
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            console.error('❌ [verifyToken] Token expirado');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            console.error('❌ [verifyToken] Token inválido:', error.message);
        }
        else {
            console.error('❌ [verifyToken] Error verificando token:', error);
        }
        throw error;
    }
};
exports.verifyToken = verifyToken;
const extractToken = (req) => {
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
exports.extractToken = extractToken;
// Función para decodificar token sin verificar (útil para depuración)
const decodeToken = (token) => {
    try {
        console.log('🔐 [decodeToken] Decodificando token sin verificar...');
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded) {
            console.log('✅ [decodeToken] Token decodificado:', {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'
            });
        }
        return decoded;
    }
    catch (error) {
        console.error('❌ [decodeToken] Error decodificando token:', error);
        return null;
    }
};
exports.decodeToken = decodeToken;
// Función para refrescar token
const refreshToken = async (oldToken) => {
    try {
        console.log('🔐 [refreshToken] Intentando refrescar token...');
        const decoded = (0, exports.verifyToken)(oldToken);
        // Generar nuevo token con la misma información
        const newToken = (0, exports.generateToken)({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            pharmacyId: decoded.pharmacyId
        });
        console.log('✅ [refreshToken] Token refrescado exitosamente');
        return newToken;
    }
    catch (error) {
        console.error('❌ [refreshToken] Error refrescando token:', error);
        return null;
    }
};
exports.refreshToken = refreshToken;
