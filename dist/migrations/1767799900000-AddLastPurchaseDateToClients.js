"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLastPurchaseDateToClients1767799900000 = void 0;
class AddLastPurchaseDateToClients1767799900000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE clients 
      DROP COLUMN IF EXISTS last_purchase_date
    `);
    }
}
exports.AddLastPurchaseDateToClients1767799900000 = AddLastPurchaseDateToClients1767799900000;
