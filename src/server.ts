import 'dotenv/config';
import { prisma } from './lib/prisma';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { AppDataSource } from './data-source';
import routes from './routes';

// ==========================================
// 1. VALIDACIÓN Y DIAGNÓSTICO DE ENTORNO
// ==========================================
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

console.log("--- DIAGNÓSTICO DE INICIO ---");
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR CRÍTICO: DATABASE_URL no está llegando al proceso.");
  // No salimos aquí para permitir que TypeORM intente su propia conexión y ver el log
} else {
  console.log("🔗 DATABASE_URL detectada en el entorno.");
  // Log de seguridad para verificar el host en Railway sin mostrar password
  const dbHost = process.env.DATABASE_URL.split('@')[1] || "Host desconocido";
  console.log(`📡 Host de DB destino: ${dbHost}`);
}

const app = express();

// Middleware de región
const regionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  (req as any).region = req.headers['x-region'] || 'MA';
  next();
};

// ==========================================
// 2. CONFIGURACIÓN DE CORS
// ==========================================
app.use(cors({
  origin: isProd 
    ? 'https://cleverhub-v2-frontend.vercel.app' // Tu URL de Vercel (sin la subruta /login)
    : 'http://localhost:5173', 
  credentials: true,
}));

app.use(express.json());

// ==========================================
// 3. CONEXIÓN POOL (SESIONES)
// ==========================================
// Forzamos el uso de DATABASE_URL para el pool de sesiones
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false
});

pgPool.on('error', (err) => {
  console.error('❌ Error inesperado en el Pool de PostgreSQL:', err.message);
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
    proxy: isProd,
    cookie: {
      httpOnly: true,
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      sameSite: isProd ? 'none' : 'lax',
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

app.get('/ping', (req, res) => res.send('pong'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'CleverHub V2 Backend 🚀',
    status: 'Online',
    version: '2.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.url });
});

// ==========================================
// 5. ARRANQUE DEL SERVIDOR
// ==========================================
console.log("⏳ Inicializando AppDataSource (TypeORM)...");

AppDataSource.initialize()
  .then(() => {
    console.log('✅ PostgreSQL conectado a través de TypeORM');
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Cleverhub Backend corriendo en puerto: ${PORT}`);
      console.log(`🌍 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error fatal en la inicialización de TypeORM:');
    console.error(error.message);
    // En Railway, si fallamos aquí, el log nos dirá exactamente por qué (ej. ECONNREFUSED)
    process.exit(1);
  });