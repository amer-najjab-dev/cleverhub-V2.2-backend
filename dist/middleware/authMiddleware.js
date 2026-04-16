"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Acceso no autorizado" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
};
exports.authenticate = authenticate;

// 🔥 Actualizar authorize para mapear SUPER_ADMIN
const authorize = (...roles) => (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: "No autenticado" });
    }
    
    // Mapear SUPER_ADMIN a ADMIN para autorización
    let userRole = user.role;
    if (userRole === 'SUPER_ADMIN') {
        userRole = 'ADMIN';
    }
    
    if (!roles.includes(userRole)) {
        return res.status(403).json({ error: "Permisos insuficientes" });
    }
    next();
};
exports.authorize = authorize;