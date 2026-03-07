import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastPurchaseDateToClients1767799900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clients 
      DROP COLUMN IF EXISTS last_purchase_date
    `);
  }
}
