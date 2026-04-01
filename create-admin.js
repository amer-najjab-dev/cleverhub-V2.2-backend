const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.users.create({
      data: {
        email: 'admin@farmacia.com',
        password: hashedPassword,
        full_name: 'Admin Farmacia',
        role: 'ADMIN',
        is_active: true,
        pharmacy_id: 1
      }
    });
    
    console.log('✅ Usuario ADMIN creado exitosamente:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Pharmacy ID: ${user.pharmacy_id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
