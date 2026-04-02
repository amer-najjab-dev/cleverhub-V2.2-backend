const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function importProducts() {
  try {
    const data = fs.readFileSync('/Users/admin/Downloads/cleverhub_productos_FINAL_COMPLETO_2026-03-27T09-50-14-558Z.json', 'utf8');
    const products = JSON.parse(data);
    
    console.log(`📦 Importando ${products.length} productos...`);
    
    let imported = 0;
    
    for (const p of products) {
      if (!p.nombre || p.nombre === '--') continue;
      
      try {
        await prisma.$executeRaw`
          INSERT INTO products (name, category, "pricePPV", "pricePPH", barcode, active, stock, sku)
          VALUES (${p.nombre}, ${p.categoria}, ${parseFloat(p.ppv?.replace(',', '.') || 0)}, ${parseFloat(p.pph?.replace(',', '.') || 0)}, ${p.ean !== '--' ? p.ean : null}, true, 0, ${p.ean !== '--' ? p.ean : 'temp-' + Date.now() + '-' + imported})
          ON CONFLICT (sku) DO NOTHING
        `;
        imported++;
        
        if (imported % 1000 === 0) {
          console.log(`✅ ${imported} productos importados...`);
        }
      } catch (err) {
        // Ignorar errores individuales
      }
    }
    
    console.log(`\n🎉 Importación completada: ${imported} productos`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
