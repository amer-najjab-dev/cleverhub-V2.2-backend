"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const SEED_CONFIG = {
    DEFAULT_PHARMACY: {
        name: 'Farmacia Principal',
        license: 'LIC-001',
        address: 'Dirección por defecto',
        phone: '+212600000000',
        email: 'contacto@farmaciaprincipal.ma',
    },
    SUPER_ADMIN: {
        email: 'admin@cleverhub.ma',
        full_name: 'Super Admin',
        password: 'Cambiar123!',
    }
};
async function main() {
    console.log('🚀 Iniciando migración multi-tenant...\n');
    // 1. Crear farmacia
    console.log('📦 Creando farmacia semilla...');
    let pharmacyId;
    const existing = await prisma.pharmacy.findFirst({
        where: { name: SEED_CONFIG.DEFAULT_PHARMACY.name }
    });
    if (!existing) {
        const pharmacy = await prisma.pharmacy.create({
            data: SEED_CONFIG.DEFAULT_PHARMACY
        });
        pharmacyId = pharmacy.id;
        console.log(`✅ Farmacia creada ID: ${pharmacyId}`);
    }
    else {
        pharmacyId = existing.id;
        console.log(`ℹ️ Farmacia existente ID: ${pharmacyId}`);
    }
    // 2. Migrar usuarios
    console.log('\n👥 Migrando usuarios...');
    const users = await prisma.users.findMany();
    let count = 0;
    for (const user of users) {
        if (!user.pharmacy_id) {
            const role = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
            await prisma.users.update({
                where: { id: user.id },
                data: { pharmacy_id: pharmacyId, role }
            });
            count++;
            console.log(`   ✓ ${user.email} → ${role}`);
        }
    }
    console.log(`✅ ${count} usuarios migrados`);
    // 3. Migrar datos
    console.log('\n📊 Migrando datos...');
    await prisma.$executeRaw `UPDATE clients SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    await prisma.$executeRaw `UPDATE inventory_lots SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    await prisma.$executeRaw `UPDATE stock_movements SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    await prisma.$executeRaw `UPDATE sales SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    await prisma.$executeRaw `UPDATE suppliers SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('✅ Datos migrados');
    // 4. SUPER_ADMIN
    console.log('\n👑 Creando SUPER_ADMIN...');
    const superAdmin = await prisma.users.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    if (!superAdmin) {
        const hash = await bcrypt_1.default.hash(SEED_CONFIG.SUPER_ADMIN.password, 10);
        await prisma.users.create({
            data: {
                email: SEED_CONFIG.SUPER_ADMIN.email,
                full_name: SEED_CONFIG.SUPER_ADMIN.full_name,
                password: hash,
                role: 'SUPER_ADMIN',
                is_active: true,
                pharmacy_id: null,
            }
        });
        console.log(`✅ SUPER_ADMIN: ${SEED_CONFIG.SUPER_ADMIN.email}`);
        console.log(`   Contraseña: ${SEED_CONFIG.SUPER_ADMIN.password}`);
    }
    else {
        console.log(`ℹ️ SUPER_ADMIN ya existe: ${superAdmin.email}`);
    }
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
}
main()
    .catch(e => { console.error('❌ Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
