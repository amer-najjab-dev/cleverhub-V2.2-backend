"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Configuración según entorno
const isProd = process.env.NODE_ENV === 'production';
// Pool para sesiones (usa DATABASE_URL directamente)
const pgPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: false } : false
});
// Adapter para Prisma
const adapter = new adapter_pg_1.PrismaPg(pgPool);
exports.prisma = new client_1.PrismaClient({
    log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
    adapter,
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// ==========================================
// 1. CONFIGURACIÓN DE RED Y PROXY (RENDER)
// ==========================================
app.set('trust proxy', 1); // Render usa proxies
// ==========================================
// 2. CONFIGURACIÓN DE CORS (VERCEL)
// ==========================================
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'https://cleverhub-v2-frontend.vercel.app'
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como apps móviles o Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('No autorizado por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-region', 'Cookie']
}));
app.use(express_1.default.json());
// ==========================================
// 3. CONFIGURACIÓN DE SESIONES (PRODUCCIÓN)
// ==========================================
app.use((0, express_session_1.default)({
    store: new ((0, connect_pg_simple_1.default)(express_session_1.default))({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    name: 'cleverhub.sid',
    cookie: {
        httpOnly: true,
        secure: isProd, // true en producción (HTTPS)
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        sameSite: isProd ? 'none' : 'lax', // 'none' permite cross-site
        domain: isProd ? '.render.com' : undefined,
        path: '/'
    },
}));
// ==========================================
// 4. MIDDLEWARE DE REGIÓN
// ==========================================
app.use((req, res, next) => {
    req.region = req.headers['x-region'] || 'MA';
    next();
});
// ==========================================
// 5. RUTAS
// ==========================================
const routes_1 = __importDefault(require("./routes"));
app.use('/api', routes_1.default);
// ==========================================
// 6. RUTAS DE SALUD
// ==========================================
app.get('/health', async (req, res) => {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: 'OK',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: String(error)
        });
    }
});
app.get('/', (req, res) => {
    res.json({
        message: 'CleverHub V2 Backend 🚀',
        status: 'Online',
        version: '2.0.0',
        environment: process.env.NODE_ENV
    });
});
// ==========================================
// 7. MANEJADOR DE ERRORES 404
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.url
    });
});
// ==========================================
// 8. ARRANQUE DEL SERVIDOR
// ==========================================
async function startServer() {
    try {
        await exports.prisma.$connect();
        console.log('✅ Prisma conectado a PostgreSQL');
        const userCount = await exports.prisma.users.count();
        console.log(`📊 Usuarios en BD: ${userCount}`);
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 Servidor en puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
            console.log(`🔗 Frontend permitido: ${allowedOrigins.join(', ')}`);
        });
    }
    catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
