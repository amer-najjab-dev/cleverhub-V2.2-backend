import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { AppDataSource } from './data-source';
import routes from './routes';

// Middleware de región simplificado (temporal)
const regionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).region = req.headers['x-region'] || 'MA';
  next();
};

const app = express();
const PORT = process.env.PORT || 5001;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Pool de PostgreSQL para sesiones
const pgPool = new Pool({
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cleverhub_db',
});

// Configuración de sesiones
app.use(
  session({
    store: new (pgSession(session))({
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
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      sameSite: 'lax',
    },
  })
);

// Middleware de región
app.use(regionMiddleware);

// ========== LOGS DE DEPURACIÓN PARA RUTAS ==========
console.log('🔍 ===== INICIO DE DEPURACIÓN DE RUTAS =====');
console.log('📦 Importando rutas desde ./routes');

// Mostrar información de routes sin usar condición problemática
console.log('📦 routes importado: ✅ Sí');
console.log('📦 routes es de tipo:', typeof routes);
console.log('📦 routes.stack:', routes?.stack ? routes.stack.length : 'No tiene stack');

// Montar rutas en /api
console.log('🔄 Montando rutas en /api');
app.use('/api', routes);
console.log('✅ Rutas montadas en /api');

// Ruta de prueba directa (sin pasar por el router)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta de prueba para verificar que el servidor responde
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ========== LISTAR TODAS LAS RUTAS REGISTRADAS ==========
console.log('📋 Rutas registradas en el servidor:');

// Función para listar rutas recursivamente
const listRoutes = (stack: any, basePath = '') => {
  if (!stack) return;
  
  stack.forEach((layer: any) => {
    if (layer.route) {
      // Ruta directa
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`   ${methods} ${basePath}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Router montado
      const routerPath = layer.regexp.source
        .replace('\\/?(?=\\/|$)', '')
        .replace(/\\\//g, '/')
        .replace(/\^/g, '')
        .replace(/\?/g, '')
        .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
      
      console.log(`\n   📌 Router montado en: ${routerPath || '/'}`);
      listRoutes(layer.handle.stack, `${basePath}${routerPath}`);
    }
  });
};

if (app._router && app._router.stack) {
  listRoutes(app._router.stack);
} else {
  console.log('   No se pudo acceder al stack de rutas');
}

console.log('🔍 ===== FIN DE DEPURACIÓN DE RUTAS =====\n');

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
      '/api/auth/me',
      '/api/ai/products/test',
      '/api/ai/products/predictions',
      '/api/ai/products/trends',
      '/api/ai/products/market-intelligence',
      '/health',
      '/ping'
    ]
  });
});

// Manejo de errores 404 - AHORA DEVUELVE JSON
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    method: req.method,
    path: req.url,
    message: `No se encontró la ruta ${req.method} ${req.url}`
  });
});

// Inicializar base de datos y arrancar servidor
AppDataSource.initialize()
  .then(() => {
    console.log('✅ PostgreSQL conectado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
      console.log(`📊 Endpoints disponibles:`);
      console.log(`   - GET  /health`);
      console.log(`   - GET  /ping`);
      console.log(`   - GET  /api/ai/products/test`);
      console.log(`   - POST /api/auth/login`);
    });
  })
  .catch((error) => {
    console.error('❌ Error conectando a PostgreSQL:', error);
    process.exit(1);
  });