#!/usr/bin/env python3
import json
import psycopg2
import re

DB_CONFIG = {
    'host': 'gondola.proxy.rlwy.net',
    'port': 45709,
    'database': 'railway',
    'user': 'postgres',
    'password': 'uOaeicOfsCBjJWTqLzCdHAHXxvqDUdp'
}

JSON_PATH = '/Users/admin/Downloads/cleverhub_productos_FINAL_COMPLETO_2026-03-27T09-50-14-558Z.json'

def clean_price(price_str):
    if not price_str or price_str == '--':
        return 0
    try:
        return float(price_str.replace(',', '.').replace(' ', ''))
    except:
        return 0

def is_valid_barcode(barcode):
    return barcode and barcode != '--' and barcode.strip() != ''

def normalize_name(name):
    return re.sub(r'[^\w\s]', '', name.lower().strip())

def main():
    print("Leyendo JSON...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Productos en JSON: {len(data)}")

    print("Conectando a BD...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Obtener productos existentes y sus códigos de barra
    cur.execute("SELECT id, name, barcode FROM products;")
    existing = cur.fetchall()
    print(f"Productos en BD: {len(existing)}")

    # Crear mapas
    existing_by_name = {}
    existing_barcodes = set()
    for pid, name, barcode in existing:
        norm = normalize_name(name)
        existing_by_name[norm] = (pid, name, barcode)
        if barcode:
            existing_barcodes.add(barcode)

    updated = 0
    inserted = 0
    skipped = 0
    invalid_barcode = 0
    duplicate_barcode = 0

    for item in data:
        name = item.get('nombre', '')
        ean = item.get('ean', '')
        ppv = clean_price(item.get('ppv', ''))
        pph = clean_price(item.get('pph', ''))
        category = item.get('categoria', '')

        if not name:
            continue

        if not is_valid_barcode(ean):
            invalid_barcode += 1
            continue

        # Verificar si el código de barras ya existe en BD
        if ean in existing_barcodes:
            duplicate_barcode += 1
            continue

        norm_name = normalize_name(name)
        matched = existing_by_name.get(norm_name)

        if matched:
            pid, db_name, existing_barcode = matched
            if existing_barcode:
                skipped += 1
            else:
                cur.execute("""
                    UPDATE products
                    SET barcode = %s, "pricePPV" = COALESCE(%s, "pricePPV"),
                        "pricePPH" = COALESCE(%s, "pricePPH"), category = COALESCE(%s, category)
                    WHERE id = %s
                """, (ean, ppv, pph, category, pid))
                updated += 1
                existing_barcodes.add(ean)
                print(f"Actualizado: {db_name} -> {ean}")
        else:
            cur.execute("""
                INSERT INTO products (name, barcode, "pricePPV", "pricePPH", category, stock, active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (name, ean, ppv, pph, category, 0, True))
            inserted += 1
            existing_barcodes.add(ean)
            print(f"Nuevo producto: {name}")

    conn.commit()
    cur.close()
    conn.close()

    print("\nRESUMEN:")
    print(f"Actualizados: {updated}")
    print(f"Insertados: {inserted}")
    print(f"Con codigo existente: {skipped}")
    print(f"Sin codigo valido en JSON: {invalid_barcode}")
    print(f"Codigo duplicado en JSON/BD: {duplicate_barcode}")
    print(f"Total productos en BD: {len(existing) + inserted}")

if __name__ == "__main__":
    main()
