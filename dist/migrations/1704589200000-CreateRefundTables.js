"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRefundTables1704589200000 = void 0;
class CreateRefundTables1704589200000 {
    async up(queryRunner) {
        // Verificar si la tabla ya existe antes de crearla
        const tableExists = await queryRunner.hasTable("refunds");
        if (!tableExists) {
            // TABLA: refunds (devoluciones)
            await queryRunner.query(`
        CREATE TABLE refunds (
          id SERIAL PRIMARY KEY,
          refund_number VARCHAR(50) UNIQUE NOT NULL,
          sale_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          total_refund_amount DECIMAL(10,2) NOT NULL,
          refund_method VARCHAR(30) NOT NULL,
          reason TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
            // TABLA: refund_items (ítems de devolución)
            await queryRunner.query(`
        CREATE TABLE refund_items (
          id SERIAL PRIMARY KEY,
          refund_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price_ppv DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
            console.log('✅ Tablas de devoluciones creadas');
        }
        else {
            console.log('✅ Tablas de devoluciones ya existen, omitiendo creación');
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS refund_items CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS refunds CASCADE`);
    }
}
exports.CreateRefundTables1704589200000 = CreateRefundTables1704589200000;
