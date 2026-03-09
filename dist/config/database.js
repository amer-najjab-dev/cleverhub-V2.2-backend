"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseHealth = exports.initializeDatabase = void 0;
const data_source_1 = require("../data-source");
const initializeDatabase = async () => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            console.log('🔄 Conectando a PostgreSQL...');
            await data_source_1.AppDataSource.initialize();
            console.log('✅ PostgreSQL conectado');
            // Log de entidades cargadas
            const entities = data_source_1.AppDataSource.entityMetadatas;
            console.log(`📊 ${entities.length} entidades TypeORM cargadas`);
        }
        return data_source_1.AppDataSource;
    }
    catch (error) {
        console.error('❌ Error al conectar con PostgreSQL:', error.message);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const checkDatabaseHealth = async () => {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        // Consulta simple de verificación
        await data_source_1.AppDataSource.query('SELECT 1 as health_check');
        return {
            status: 'healthy',
            database: 'PostgreSQL',
            connected: true,
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            database: 'PostgreSQL',
            connected: false,
            error: error.message,
        };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
