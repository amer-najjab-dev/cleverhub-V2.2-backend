import 'dotenv/config';
import { prisma } from './lib/prisma';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { AppDataSource } from './data-source';
import routes from './routes';

const app = express();

// ==========================================
// 1. CONFIGURACIÓN DE RED Y PROXY (RAILWAY)
// ==========================================
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// IMPORTANTE: Permite que las cookies de sesión funcionen tras el proxy de Railway
app.set('trust proxy', 1);

console.log("--- DIAGNÓSTICO DE INICIO ---");
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR CRÍTICO: DATABASE_URL no detectada.");
} else {
  const dbHost = process.env.DATABASE_URL.split('@')[1] || "Host desconocido";
  console.log(`📡 Host de DB destino: ${dbHost}`);
}

// ==========================================
// 2. CONFIGURACIÓN DE CORS
// ==========================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://cleverhub-v2-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-region']
}));

app.use(express.json());

// Middleware de región
const regionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).region = req.headers['x-region'] || 'MA';
  next();
};

// ==========================================
// 3. CONEXIÓN POOL Y SESIONES
// ==========================================
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

app.use(
  session({
    store: new (pgSession(session))({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'cleverhub_super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    name: 'cleverhub.sid', // Nombre de la cookie personalizado
    cookie: {
      httpOnly: true,
      secure: isProd, // True en producción (requiere HTTPS)
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      sameSite: isProd ? 'none' : 'lax', // 'none' permite cross-site entre Vercel y Railway
    },
  })
);

app.use(regionMiddleware);

// ==========================================
// 4. RUTAS
// ==========================================
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    db_connected: !!process.env.DATABASE_URL,
    env: process.env.NODE_ENV 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'CleverHub V2 Backend 🚀',
    status: 'Online',
    version: '2.0.0'
  });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.url });
});

// ==========================================
// 5. ARRANQUE DEL SERVIDOR
// ==========================================
AppDataSource.initialize()
  .then(() => {
    console.log('✅ PostgreSQL conectado a través de TypeORM');
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Cleverhub Backend en puerto: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error fatal TypeORM:', error.message);
    process.exit(1);
  });

export default app;