"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const data_source_1 = require("./data-source");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// 1. AJUSTE DE PUERTO PARA RAILWAY
const PORT = process.env.PORT || 3000;
// Middleware de región simplificado (temporal)
const regionMiddleware = (req, res, next) => {
    req.region = req.headers['x-region'] || 'MA';
    next();
};
// 2. CONFIGURACIÓN DE CORS (Ajustado para producción)
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? true // Permite el origen que haga la petición en producción (o pon tu URL de Railway aquí)
        : 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// 3. POOL DE POSTGRESQL (Usando la URL de Railway si existe)
const pgPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL, // Prioridad a la URL de Railway
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// Configuración de sesiones
app.use((0, express_session_1.default)({
    store: new ((0, connect_pg_simple_1.default)(express_session_1.default))({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true, // Cambiado a true por si la tabla no existe en la nueva DB
    }),
    secret: process.env.SESSION_SECRET || 'cleverhub_super_secret_key',
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production', // Necesario para Railway (detrás de proxy)
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para CORS cross-domain en prod
    },
}));
app.use(regionMiddleware);
// ========== RUTAS ==========
app.use('/api', routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});
app.get('/ping', (req, res) => {
    res.send('pong');
});
app.get('/', (req, res) => {
    res.json({
        message: 'CleverHub V2 Backend 🚀',
        status: 'Online',
        version: '2.0.0'
    });
});
// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.url
    });
});
// 4. INICIALIZACIÓN Y ARRANQUE (Ajustado para 0.0.0.0)
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ PostgreSQL conectado a través de TypeORM');
    // IMPORTANTE: Escuchar en 0.0.0.0 para que Railway pueda exponer el servicio
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🚀 Cleverhub Backend running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
})
    .catch((error) => {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
});
