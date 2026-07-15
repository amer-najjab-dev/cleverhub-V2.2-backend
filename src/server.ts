import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { requireAuth } from './middleware/auth';
import { addPharmacyFilter } from './middleware/rbac';

// Importar controladores para rutas públicas
import { authController } from './controllers/auth.controller';
import { superAdminController } from './controllers/superadmin.controller';

// Extender tipos de sesión
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole?: string;
    userEmail?: string;
    pharmacyId?: number;
  }
}

// Configuración según entorno
const isProd = process.env.NODE_ENV === 'production';

// Pool para sesiones (usa DATABASE_URL directamente)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
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
// 2. CONFIGURACIÓN DE CORS (SIMPLIFICADA)
// ==========================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://cleverhub-v2-frontend.vercel.app',
  'https://cleverhub-v2-2-frontend.vercel.app',
  /^https:\/\/cleverhub-v2-2-frontend-.*\.vercel\.app$/,  // ← Añadir esta línea
  /\.up\.railway\.app$/
];

// CORS simplificado - permite todos los orígenes (solo para diagnóstico)
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// ==========================================
// 3. CONFIGURACIÓN DE SESIONES (PRODUCCIÓN)
// ==========================================
const PgSession = pgSession(session);
app.use(
  session({
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
// 5. RUTAS PÚBLICAS (Sin autenticación)
// ==========================================
console.log('🔄 Cargando rutas públicas...');

// Ruta de salud (pública)
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
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/admin/cron/check-expirations', superAdminController.runExpirationCheck);

// Ruta para obtener usuario actual (requiere autenticación)
app.get('/api/auth/me', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    
    const user = await prisma.users.findUnique({
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
    
    res.json({ 
      success: true, 
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        pharmacyId: user.pharmacy_id,
        pharmacy: user.pharmacy
      }
    });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. RUTAS AUTENTICADAS (Con middleware)
// ==========================================
console.log('🔄 Cargando rutas autenticadas...');

// Importar rutas
import routes from './routes';

// Aplicar middleware de autenticación a todas las rutas bajo /api
app.use(requireAuth, addPharmacyFilter, routes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    await prisma.$connect();
    console.log('✅ Prisma conectado a PostgreSQL');

    const userCount = await prisma.users.count();
    console.log(`📊 Usuarios en BD: ${userCount}`);
    
    const pharmacyCount = await prisma.pharmacy.count();
    console.log(`📊 Farmacias en BD: ${pharmacyCount}`);

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor en puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend permitido: ${allowedOrigins.filter(o => typeof o === 'string').join(', ')}`);
      console.log(`🔐 Modo multi-tenant: Activado`);
    });

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Manejo de señales de cierre
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;