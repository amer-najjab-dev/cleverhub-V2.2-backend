import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientHealthRecordsTable1768488914000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS client_health_records (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                glucose_level DECIMAL(5,2),
                blood_pressure_systolic INTEGER,
                blood_pressure_diastolic INTEGER,
                weight DECIMAL(5,2),
                heart_rate INTEGER,
                record_date DATE NOT NULL,
                notes TEXT,
                glucose_status VARCHAR(20),
                blood_pressure_status VARCHAR(20),
                heart_rate_status VARCHAR(20),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Índice para mejorar búsquedas por cliente
            CREATE INDEX IF NOT EXISTS idx_client_health_records_client_id ON client_health_records(client_id);
            
            -- Índice para búsquedas por fecha
            CREATE INDEX IF NOT EXISTS idx_client_health_records_record_date ON client_health_records(record_date);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS client_health_records CASCADE`);
    }
}
