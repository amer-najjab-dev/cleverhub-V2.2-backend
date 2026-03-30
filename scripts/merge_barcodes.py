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

    cur.execute("SELECT id, name, barcode FROM products;")
    products = cur.fetchall()
    print(f"Productos en BD: {len(products)}")

    product_map = {}
    for pid, name, barcode in products:
        norm_name = normalize_name(name)
        if norm_name not in product_map:
            product_map[norm_name] = (pid, name, barcode)

    updated = 0
    skipped = 0
    not_found = 0
    no_ean = 0

    for item in data:
        json_name = item.get('nombre', '')
        ean = item.get('ean', '')
        
        if not ean or ean == '--':
            no_ean += 1
            continue

        norm_json_name = normalize_name(json_name)
        matched = product_map.get(norm_json_name)
        
        if not matched:
            for db_norm, (pid, db_name, barcode) in product_map.items():
                if norm_json_name in db_norm or db_norm in norm_json_name:
                    matched = (pid, db_name, barcode)
                    break
        
        if matched:
            pid, db_name, barcode = matched
            if barcode:
                skipped += 1
            else:
                cur.execute("UPDATE products SET barcode = %s WHERE id = %s;", (ean, pid))
                updated += 1
                print(f"Actualizado: {db_name} -> {ean}")
        else:
            not_found += 1
            if not_found <= 20:
                print(f"No encontrado: {json_name}")

    conn.commit()
    cur.close()
    conn.close()

    print("\nRESUMEN:")
    print(f"Actualizados: {updated}")
    print(f"Ya tenian codigo: {skipped}")
    print(f"No encontrados: {not_found}")
    print(f"Sin codigo en JSON: {no_ean}")

if __name__ == "__main__":
    main()
