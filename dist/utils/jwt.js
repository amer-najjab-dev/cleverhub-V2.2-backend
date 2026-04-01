"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractToken = exports.verifyToken = exports.generateToken = void 0;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = 'cleverhub-secret-key-2026';
const generateToken = (payload) => {
    console.log('🔐 [generateToken] Generando token con payload:', {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        pharmacyId: payload.pharmacyId
    });
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ [generateToken] Token generado:', token.substring(0, 50) + '...');
    return token;
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    console.log('🔐 [verifyToken] Verificando token:', token.substring(0, 50) + '...');
    console.log('🔐 [verifyToken] Usando JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('✅ [verifyToken] Token verificado exitosamente:', {
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
exports.extractToken = extractToken;
