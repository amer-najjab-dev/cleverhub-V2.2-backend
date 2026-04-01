// prisma/seed-subscriptions.ts
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Inicializando suscripciones para farmacias existentes...');
  
  const pharmacies = await prisma.pharmacy.findMany();
  
  for (const pharmacy of pharmacies) {
    const existing = await prisma.subscription.findUnique({
      where: { pharmacy_id: pharmacy.id }
    });
    
    if (!existing) {
      await prisma.subscription.create({
        data: {
          pharmacy_id: pharmacy.id,
          plan: 'BASIC',
          status: 'ACTIVE',
          start_date: new Date(),
          end_date: addDays(new Date(), 365), // 1 año
          next_billing_date: addDays(new Date(), 365)
        }
      });
      console.log(`✅ Suscripción creada para ${pharmacy.name}`);
    }
  }
  
  console.log('🎉 Todas las suscripciones inicializadas');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
