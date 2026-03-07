import { AppDataSource } from '../data-source';

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      console.log('🔄 Conectando a PostgreSQL...');
      await AppDataSource.initialize();
      console.log('✅ PostgreSQL conectado');
      
      // Log de entidades cargadas
      const entities = AppDataSource.entityMetadatas;
      console.log(`📊 ${entities.length} entidades TypeORM cargadas`);
    }
    return AppDataSource;
  } catch (error: any) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    throw error;
  }
};

export const checkDatabaseHealth = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Consulta simple de verificación
    await AppDataSource.query('SELECT 1 as health_check');
    
    return {
      status: 'healthy',
      database: 'PostgreSQL',
      connected: true,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      database: 'PostgreSQL',
      connected: false,
      error: error.message,
    };
  }
};
