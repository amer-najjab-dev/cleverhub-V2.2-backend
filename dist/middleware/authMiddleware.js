"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware de autenticación
 * Verifica token JWT
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Acceso no autorizado" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Inyectamos el usuario en la request
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware de autorización por roles
 */
const authorize = (...roles) => (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: "Permisos insuficientes" });
    }
    next();
};
exports.authorize = authorize;
