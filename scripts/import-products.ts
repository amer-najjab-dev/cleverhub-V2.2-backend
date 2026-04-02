import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parsePrice(value: string): number {
  if (!value || value === '--') return 0;
  return parseFloat(value.replace(',', '.'));
}

async function importProducts() {
  try {
    const filePath = '/Users/admin/Downloads/cleverhub_productos_FINAL_COMPLETO_2026-03-27T09-50-14-558Z.json';
    const products = require(filePath);
    
    console.log(`📦 Importando ${products.length} productos...`);
    
    let imported = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const product of products) {
      try {
        const sku = product.ean && product.ean !== '--' ? product.ean : `temp-${Date.now()}-${Math.random()}-${imported}`;
        const pricePPV = parsePrice(product.ppv);
        const pricePPH = parsePrice(product.pph);
        
        if (!product.nombre || product.nombre === '--') {
          skipped++;
          continue;
        }
        
        await prisma.products.upsert({
          where: { sku: sku },
          update: {
            name: product.nombre,
            pricePPV: pricePPV,
            pricePPH: pricePPH,
            category: product.categoria,
            barcode: product.ean !== '--' ? product.ean : null,
            active: true,
            stock: 0,
          },
          create: {
            name: product.nombre,
            sku: sku,
            pricePPV: pricePPV,
            pricePPH: pricePPH,
            category: product.categoria,
            barcode: product.ean !== '--' ? product.ean : null,
            active: true,
            stock: 0,
          }
        });
        imported++;
        
        if (imported % 1000 === 0) {
          console.log(`✅ ${imported} productos importados...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error importando: ${product.nombre}`, error);
      }
    }
    
    console.log(`\n🎉 Importación completada:`);
    console.log(`   ✅ Importados: ${imported}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   ⏭️ Saltados (sin nombre): ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error leyendo archivo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
