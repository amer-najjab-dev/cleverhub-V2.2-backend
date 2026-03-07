import { AppDataSource } from './data-source';

async function addColumn() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada');
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    console.log('🔄 Agregando columna last_purchase_date a clients...');
    await queryRunner.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP NULL
    `);
    
    console.log('✅ Columna agregada exitosamente');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addColumn();
