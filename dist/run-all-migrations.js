"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
async function runAllMigrations() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Base de datos conectada');
        console.log('🔄 Ejecutando migraciones pendientes...');
        const migrations = await data_source_1.AppDataSource.runMigrations();
        if (migrations.length > 0) {
            console.log(`✅ ${migrations.length} migración(es) ejecutada(s):`);
            migrations.forEach(migration => {
                console.log(`   - ${migration.name}`);
            });
        }
        else {
            console.log('✅ No hay migraciones pendientes');
        }
        await data_source_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        process.exit(1);
    }
}
runAllMigrations();
