"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regionMiddleware = void 0;
const regionMiddleware = (req, res, next) => {
    const region = req.headers['x-region'] || 'MA';
    req.region = region;
    console.log(`📥 Petición a ${req.path} desde región: ${region}`);
    next();
};
exports.regionMiddleware = regionMiddleware;
