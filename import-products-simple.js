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
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        const sku = product.ean && product.ean !== '--' ? product.ean : `PROD_${Date.now()}_${i}`;
        const pricePPV = parsePrice(product.ppv);
        const pricePPH = parsePrice(product.pph);
        
        if (!product.nombre || product.nombre === '--') continue;
        
        await prisma.$executeRaw`
          INSERT INTO products (name, sku, "pricePPV", "pricePPH", category, barcode, active, stock, "createdAt", "updatedAt")
          VALUES (${product.nombre}, ${sku}, ${pricePPV}, ${pricePPH}, ${product.categoria}, ${product.ean !== '--' ? product.ean : null}, true, 0, NOW(), NOW())
          ON CONFLICT (sku) DO UPDATE SET
            name = EXCLUDED.name,
            "pricePPV" = EXCLUDED."pricePPV",
            "pricePPH" = EXCLUDED."pricePPH",
            category = EXCLUDED.category,
            barcode = EXCLUDED.barcode,
            "updatedAt" = NOW()
        `;
        
        imported++;
        
        if (imported % 1000 === 0) {
          console.log(`✅ ${imported} productos importados...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error con producto ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Importación completada!`);
    console.log(`   ✅ Importados: ${imported}`);
    console.log(`   ❌ Errores: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
