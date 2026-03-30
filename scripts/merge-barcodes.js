const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// CONFIGURACIÓN
const JSON_PATH = 
'/Users/admin/Downloads/cleverhub_productos_FINAL_COMPLETO_2026-03-27T09-50-14-558Z.json';

async function mergeBarcodes() {
  try {
    // 1. Leer JSON
    console.log('📂 Leyendo archivo JSON...');
    const barcodeData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📦 Productos en JSON: ${barcodeData.length}`);

    // 2. Obtener todos los productos existentes
    console.log('🔍 Obteniendo productos de la base de datos...');
    const existingProducts = await prisma.products.findMany({
      select: { id: true, name: true, barcode: true }
    });
    console.log(`📦 Productos en BD: ${existingProducts.length}`);

    // 3. Crear mapa de productos por nombre (normalizado)
    const productMap = new Map();
    existingProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      productMap.set(normalizedName, product);
    });

    let updated = 0;
    let skipped = 0; // ya tienen código
    let notFound = 0;
    let noEan = 0; // productos sin código de barras en JSON
    const notFoundList = [];

    // 4. Procesar cada producto del JSON
    for (const item of barcodeData) {
      const jsonName = item.nombre;
      const ean = item.ean;
      
      // Saltar si no tiene EAN válido
      if (!ean || ean === '--' || ean.trim() === '') {
        noEan++;
        continue;
      }

      // Normalizar nombre del JSON
      let normalizedJsonName = jsonName.toLowerCase().trim();
      
      // Buscar coincidencia exacta o parcial
      let matchedProduct = null;
      
      // Primero búsqueda exacta
      matchedProduct = productMap.get(normalizedJsonName);
      
      // Si no hay coincidencia exacta, buscar por coincidencia parcial
      if (!matchedProduct) {
        for (const [dbName, product] of productMap.entries()) {
          if (dbName.includes(normalizedJsonName) || 
normalizedJsonName.includes(dbName)) {
            matchedProduct = product;
            break;
          }
        }
      }

      if (matchedProduct) {
        if (matchedProduct.barcode) {
          // Ya tiene código, lo saltamos
          skipped++;
        } else {
          await prisma.products.update({
            where: { id: matchedProduct.id },
            data: { barcode: ean }
          });
          updated++;
          console.log(`✅ ${matchedProduct.name} → ${ean}`);
        }
      } else {
        notFound++;
        notFoundList.push(jsonName);
        if (notFound <= 20) {
          console.log(`❌ No encontrado: ${jsonName}`);
        }
      }
    }

    // 5. Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(50));
    console.log(`✅ Actualizados con código de barras: ${updated}`);
    console.log(`⚠️ Ya tenían código de barras: ${skipped}`);
    console.log(`❌ Productos no encontrados en BD: ${notFound}`);
    console.log(`📦 Sin código de barras en JSON: ${noEan}`);
    
    if (notFoundList.length > 0 && notFoundList.length <= 30) {
      console.log('\n📋 Productos no encontrados:');
      notFoundList.forEach(name => console.log(`  - ${name}`));
    } else if (notFoundList.length > 30) {
      console.log(`\n📋 ${notFoundList.length} productos no encontrados 
(primeros 10):`);
      notFoundList.slice(0, 10).forEach(name => console.log(`  - ${name}`));
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeBarcodes();
