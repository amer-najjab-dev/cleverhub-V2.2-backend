const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function parsePrice(value) {
  if (!value || value === '--') return 0;
  return parseFloat(String(value).replace(',', '.'));
}

async function importProducts() {
  try {
    const filePath = '/Users/admin/Downloads/cleverhub_productos_50k_productos_2026-03-28T16-51-44-264Z.json';
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(fileContent);
    
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
        console.error(`❌ Error importando: ${product.nombre}`, error.message);
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
