"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
// Usar PrismaClient estándar sin adapter
const prisma = new client_1.PrismaClient();
const SEED_CONFIG = {
    DEFAULT_PHARMACY: {
        name: 'Farmacia Principal',
        license: 'LIC-001',
        address: 'Dirección por defecto - Actualizar después',
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
    console.log('🚀 Iniciando migración a modelo multi-tenant...');
    console.log('---');
    // 1. Crear farmacia semilla
    console.log('📦 Paso 1/4: Creando farmacia semilla...');
    let pharmacyId;
    const existingPharmacy = await prisma.pharmacy.findFirst({
        where: { name: SEED_CONFIG.DEFAULT_PHARMACY.name }
    });
    if (!existingPharmacy) {
        const pharmacy = await prisma.pharmacy.create({
            data: SEED_CONFIG.DEFAULT_PHARMACY
        });
        pharmacyId = pharmacy.id;
        console.log(`✅ Farmacia creada con ID: ${pharmacyId}`);
    }
    else {
        pharmacyId = existingPharmacy.id;
        console.log(`ℹ️ Farmacia existente con ID: ${pharmacyId}`);
    }
    console.log('---');
    // 2. Migrar usuarios
    console.log('👥 Paso 2/4: Migrando usuarios...');
    const users = await prisma.users.findMany();
    let usersMigrated = 0;
    for (const user of users) {
        if (!user.pharmacy_id) {
            let newRole = 'EMPLOYEE';
            if (user.role?.toUpperCase() === 'ADMIN') {
                newRole = 'ADMIN';
            }
            await prisma.users.update({
                where: { id: user.id },
                data: {
                    pharmacy_id: pharmacyId,
                    role: newRole,
                }
            });
            usersMigrated++;
            console.log(`   ✓ ${user.email} → ${newRole}`);
        }
    }
    console.log(`✅ ${usersMigrated} usuarios migrados`);
    console.log('---');
    // 3. Migrar datos privados
    console.log('📊 Paso 3/4: Migrando datos privados...');
    await prisma.$executeRaw `UPDATE clients SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('   ✓ Clientes actualizados');
    await prisma.$executeRaw `UPDATE inventory_lots SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('   ✓ Inventory lots actualizados');
    await prisma.$executeRaw `UPDATE stock_movements SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('   ✓ Stock movements actualizados');
    await prisma.$executeRaw `UPDATE sales SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('   ✓ Ventas actualizadas');
    await prisma.$executeRaw `UPDATE suppliers SET pharmacy_id = ${pharmacyId} WHERE pharmacy_id IS NULL`;
    console.log('   ✓ Proveedores actualizados');
    console.log('✅ Datos privados migrados');
    console.log('---');
    // 4. Crear SUPER_ADMIN
    console.log('👑 Paso 4/4: Creando SUPER_ADMIN...');
    const superAdminExists = await prisma.users.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    if (!superAdminExists) {
        const hashedPassword = await bcrypt_1.default.hash(SEED_CONFIG.SUPER_ADMIN.password, 10);
        await prisma.users.create({
            data: {
                email: SEED_CONFIG.SUPER_ADMIN.email,
                full_name: SEED_CONFIG.SUPER_ADMIN.full_name,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                is_active: true,
                pharmacy_id: null,
            }
        });
        console.log(`✅ SUPER_ADMIN creado: ${SEED_CONFIG.SUPER_ADMIN.email}`);
        console.log(`   Contraseña temporal: ${SEED_CONFIG.SUPER_ADMIN.password}`);
    }
    else {
        console.log(`ℹ️ SUPER_ADMIN ya existe: ${superAdminExists.email}`);
    }
    console.log('---');
    console.log('🎉 ¡MIGRACIÓN COMPLETADA!');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
});
