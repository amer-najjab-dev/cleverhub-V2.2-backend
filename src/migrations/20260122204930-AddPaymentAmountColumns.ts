import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentAmountColumns20260122204930 implements MigrationInterface {
    name = 'AddPaymentAmountColumns20260122204930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar nuevas columnas a la tabla sales
        await queryRunner.query(`
            ALTER TABLE sales 
            ADD COLUMN IF NOT EXISTS amount_received decimal(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS amount_applied decimal(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS amount_pending decimal(10,2) DEFAULT 0
        `);
        
        // Actualizar valores existentes basados en campos actuales
        await queryRunner.query(`
            UPDATE sales 
            SET amount_received = COALESCE(paid_amount, 0),
                amount_applied = CASE 
                    WHEN payment_method IN ('card', 'transfer', 'check', 'cash') THEN total
                    WHEN payment_status = 'paid' THEN total
                    WHEN payment_status = 'partial' THEN COALESCE(paid_amount, 0)
                    ELSE 0
                END,
                amount_pending = CASE 
                    WHEN (total - amount_applied) > 0 THEN (total - amount_applied)
                    ELSE 0
                END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir los cambios: eliminar las columnas agregadas
        await queryRunner.query(`
            ALTER TABLE sales 
            DROP COLUMN IF EXISTS amount_received,
            DROP COLUMN IF EXISTS amount_applied,
            DROP COLUMN IF EXISTS amount_pending
        `);
    }
}
