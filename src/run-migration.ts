import { AppDataSource } from './data-source';
import { CreateRefundTables1704589200000 } from './migrations/1704589200000-CreateRefundTables';

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada');
    
    const migration = new CreateRefundTables1704589200000();
    console.log('🔄 Ejecutando migración...');
    
    await migration.up(AppDataSource.createQueryRunner());
    console.log('✅ Migración completada exitosamente');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

runMigration();
