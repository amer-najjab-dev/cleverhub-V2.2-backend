"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || "Error del servidor",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
exports.default = errorHandler;
