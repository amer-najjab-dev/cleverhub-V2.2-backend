import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando seed en Railway...')
  
  // 1. Crear farmacia si no existe
  let pharmacyId = 1
  const existingPharmacy = await prisma.pharmacy.findFirst({
    where: { name: 'Farmacia Principal' }
  })
  
  if (!existingPharmacy) {
    const pharmacy = await prisma.pharmacy.create({
      data: {
        name: 'Farmacia Principal',
        license: 'LIC-001',
        address: 'Dirección por defecto',
        phone: '+212600000000',
        email: 'contacto@farmaciaprincipal.ma',
      }
    })
    pharmacyId = pharmacy.id
    console.log('✅ Farmacia creada')
  }
  
  // 2. Crear SUPER_ADMIN
  const superAdminExists = await prisma.users.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })
  
  if (!superAdminExists) {
    const hashedPassword = await bcrypt.hash('Cambiar123!', 10)
    await prisma.users.create({
      data: {
        email: 'admin@cleverhub.ma',
        full_name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        is_active: true,
        pharmacy_id: null,
      }
    })
    console.log('✅ SUPER_ADMIN creado')
  }
  
  // 3. Crear usuario ADMIN
  const adminExists = await prisma.users.findFirst({
    where: { email: 'admin@farmacia.ma' }
  })
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('Cambiar123!', 10)
    await prisma.users.create({
      data: {
        email: 'admin@farmacia.ma',
        full_name: 'Admin Farmacia',
        password: hashedPassword,
        role: 'ADMIN',
        is_active: true,
        pharmacy_id: pharmacyId,
      }
    })
    console.log('✅ ADMIN creado')
  }
  
  console.log('🎉 Seed completado')
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect())
