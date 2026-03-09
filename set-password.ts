import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Usamos la configuración simplificada para evitar errores de tipos
const prisma = new PrismaClient({
  // @ts-ignore
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const email = 'admin@cleverhub.com'; 
  const password = 'admin'; 

  console.log('⏳ Cifrando contraseña...');
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('⏳ Conectando con Railway para actualizar el usuario...');
  
  // Usamos 'any' para saltarnos la validación de esquema local desactualizado
  const user = await (prisma as any).users.upsert({
    where: { email: email },
    update: { 
      password: hashedPassword,
      is_active: true 
    },
    create: {
      email: email,
      password: hashedPassword,
      full_name: 'Administrador CleverHub',
      role: 'admin',
      is_active: true
    },
  });

  console.log('---------------------------------------------');
  console.log('✅ BASE DE DATOS ACTUALIZADA CON ÉXITO');
  console.log('📧 Email:', user.email);
  console.log('🔑 Password: admin');
  console.log('---------------------------------------------');
}

main()
  .catch((e) => console.error('❌ ERROR:', e))
  .finally(async () => await prisma.$disconnect());