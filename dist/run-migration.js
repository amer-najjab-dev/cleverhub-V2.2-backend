"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
const _1704589200000_CreateRefundTables_1 = require("./migrations/1704589200000-CreateRefundTables");
async function runMigration() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Base de datos conectada');
        const migration = new _1704589200000_CreateRefundTables_1.CreateRefundTables1704589200000();
        console.log('🔄 Ejecutando migración...');
        await migration.up(data_source_1.AppDataSource.createQueryRunner());
        console.log('✅ Migración completada exitosamente');
        await data_source_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error en migración:', error);
        process.exit(1);
    }
}
runMigration();
