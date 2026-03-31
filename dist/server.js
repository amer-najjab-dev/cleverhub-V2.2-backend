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
const auth_1 = require("./middleware/auth");
const rbac_1 = require("./middleware/rbac");
// Importar controladores para rutas públicas
const auth_controller_1 = require("./controllers/auth.controller");
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
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://cleverhub-v2-frontend.vercel.app',
    // Expresión regular para aceptar cualquier preview de Vercel
    /^https:\/\/cleverhub-v2-frontend-git-[a-zA-Z0-9-]+\.vercel\.app$/,
    /^https:\/\/cleverhub-v2-frontend-.*\.vercel\.app$/,
    // Railway app domains
    /\.up\.railway\.app$/
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, apps móviles)
        if (!origin)
            return callback(null, true);
        // Verificar si el origen coincide con algún patrón (string o regex)
        const allowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            }
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        if (allowed) {
            callback(null, true);
        }
        else {
            console.warn('🚫 Origen bloqueado por CORS:', origin);
            callback(new Error('No autorizado por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json());
// ==========================================
// 3. CONFIGURACIÓN DE SESIONES (PRODUCCIÓN)
// ==========================================
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
app.use((0, express_session_1.default)({
    store: new PgSession({
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
        path: '/',
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
// 5. RUTAS PÚBLICAS (Sin autenticación)
// ==========================================
console.log('🔄 Cargando rutas públicas...');
// Ruta de salud (pública)
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
// Ruta raíz (pública)
app.get('/', (req, res) => {
    res.json({
        message: 'CleverHub V2 Backend 🚀',
        status: 'Online',
        version: '2.0.0',
        environment: process.env.NODE_ENV
    });
});
// Rutas de autenticación (públicas)
app.post('/api/auth/login', auth_controller_1.authController.login);
app.post('/api/auth/logout', auth_controller_1.authController.logout);
// app.post('/api/auth/register', authController.register); // Si existe
// app.post('/api/auth/forgot-password', authController.forgotPassword); // TODO: Implementar
// app.post('/api/auth/reset-password', authController.resetPassword); // TODO: Implementar
// Ruta para obtener usuario actual (requiere autenticación)
// TODO: Implementar getMe en authController
// app.get('/api/auth/me', requireAuth, authController.getMe);
// Ruta temporal para obtener usuario actual (alternativa)
app.get('/api/auth/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        const user = await exports.prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                pharmacy_id: true,
                pharmacy: {
                    select: {
                        id: true,
                        name: true,
                        license: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ==========================================
// 6. RUTAS AUTENTICADAS (Con middleware)
// ==========================================
console.log('🔄 Cargando rutas autenticadas...');
// Importar rutas
const routes_1 = __importDefault(require("./routes"));
// Aplicar middleware de autenticación a todas las rutas bajo /api
// El middleware addPharmacyFilter añade el filtro de farmacia automáticamente
app.use('/api', auth_1.requireAuth, rbac_1.addPharmacyFilter, routes_1.default);
// ==========================================
// 7. MANEJADOR DE ERRORES 404
// ==========================================
app.use((req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.url
    });
});
// ==========================================
// 8. MANEJADOR DE ERRORES GLOBAL
// ==========================================
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    // Error de CORS
    if (err.message === 'No autorizado por CORS') {
        return res.status(403).json({
            success: false,
            error: 'Origen no autorizado'
        });
    }
    // Error de autenticación
    if (err.message === 'No autorizado') {
        return res.status(401).json({
            success: false,
            error: 'No autorizado'
        });
    }
    // Error de base de datos
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: 'Registro duplicado',
            field: err.meta?.target
        });
    }
    // Error genérico
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// ==========================================
// 9. ARRANQUE DEL SERVIDOR
// ==========================================
async function startServer() {
    try {
        await exports.prisma.$connect();
        console.log('✅ Prisma conectado a PostgreSQL');
        const userCount = await exports.prisma.users.count();
        console.log(`📊 Usuarios en BD: ${userCount}`);
        // Verificar si hay farmacias
        const pharmacyCount = await exports.prisma.pharmacy.count();
        console.log(`📊 Farmacias en BD: ${pharmacyCount}`);
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 Servidor en puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
            console.log(`🔗 Frontend permitido: ${allowedOrigins.filter(o => typeof o === 'string').join(', ')}`);
            console.log(`🔐 Modo multi-tenant: Activado`);
        });
    }
    catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}
// Manejo de señales de cierre
process.on('SIGINT', async () => {
    console.log('🛑 Cerrando servidor...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🛑 Cerrando servidor...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
startServer();
exports.default = app;
