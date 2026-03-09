"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
async function runMigration() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Base de datos conectada');
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        console.log('🔄 Agregando columna last_purchase_date a clients...');
        await queryRunner.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP NULL
    `);
        console.log('✅ Migración completada exitosamente');
        await data_source_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
runMigration();
