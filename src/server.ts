import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Extender tipos de sesión
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole?: string;
    userEmail?: string;
  }
}

// Configuración según entorno
const isProd = process.env.NODE_ENV === 'production';

// Pool para sesiones (usa DATABASE_URL directamente)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

// Adapter para Prisma
const adapter = new PrismaPg(pgPool as any);

export const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
  adapter,
});

const app = express();
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
  process.env.FRONTEND_URL || 'https://cleverhub-v2-frontend.vercel.app',
  // Expresión regular para aceptar cualquier preview de Vercel
  /^https:\/\/cleverhub-v2-frontend-git-[a-zA-Z0-9-]+\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, apps móviles)
    if (!origin) return callback(null, true);
    
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
    } else {
      console.warn('🚫 Origen bloqueado por CORS:', origin);
      callback(new Error('No autorizado por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// ==========================================
// 3. CONFIGURACIÓN DE SESIONES (PRODUCCIÓN)
// ==========================================
app.use(
  session({
    store: new (pgSession(session))({
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
      path: '/'
    },
  })
);

// ==========================================
// 4. MIDDLEWARE DE REGIÓN
// ==========================================
app.use((req, res, next) => {
  (req as any).region = req.headers['x-region'] || 'MA';
  next();
});

// ==========================================
// 5. RUTAS
// ==========================================
import routes from './routes';
app.use('/api', routes);

// ==========================================
// 6. RUTAS DE SALUD
// ==========================================
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
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
    await prisma.$connect();
    console.log('✅ Prisma conectado a PostgreSQL');

    const userCount = await prisma.users.count();
    console.log(`📊 Usuarios en BD: ${userCount}`);

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor en puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend permitido: ${allowedOrigins.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

startServer();

export default app;