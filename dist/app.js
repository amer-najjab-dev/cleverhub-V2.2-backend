"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const data_source_1 = require("./data-source");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Configuración de CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// Pool de PostgreSQL para sesiones
const pgPool = new pg_1.Pool({
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cleverhub_db',
});
// Configuración de sesiones
app.use((0, express_session_1.default)({
    store: new ((0, connect_pg_simple_1.default)(express_session_1.default))({
        pool: pgPool,
        tableName: 'session',
        createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'cleverhub_super_secret_key_change_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8,
        sameSite: 'lax',
    },
}));
// Rutas
app.use('/api', routes_1.default);
// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'CleverHub V2 Backend 🚀',
        version: '2.0.0',
        endpoints: [
            '/api/products',
            '/api/products/search?q=query',
            '/api/clients',
            '/api/sales',
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/me'
        ]
    });
});
// Inicializar base de datos y arrancar servidor
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ PostgreSQL conectado');
    app.listen(PORT, () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error('❌ Error conectando a PostgreSQL:', error);
    process.exit(1);
});
exports.default = app;
