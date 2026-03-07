import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import { AppDataSource } from './data-source';
import routes from './routes';

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
      maxAge: 1000 * 60 * 60 * 8,
      sameSite: 'lax',
    },
  })
);

// Rutas
app.use('/api', routes);

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
AppDataSource.initialize()
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

export default app;