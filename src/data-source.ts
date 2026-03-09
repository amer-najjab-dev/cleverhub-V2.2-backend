import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Product } from './entities/Product';
import { PriceHistory } from './entities/PriceHistory';
import { InventoryLot } from './entities/InventoryLot';
import { StockMovement } from './entities/StockMovement';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: "postgres",
  // Usamos la URL completa que detectamos en los logs para evitar fallos de host/puerto
  url: process.env.DATABASE_URL,
  
  // Sincronización desactivada en producción para proteger los datos de Cleverhub
  synchronize: false, 
  
  logging: isProd ? ['error'] : ['query', 'error'],
  
  // Configuración de SSL necesaria para conexiones externas/internas en la nube
  ssl: isProd ? { rejectUnauthorized: false } : false,

  entities: [
    __dirname + "/entities/*.ts",
    __dirname + "/entities/*.js"
  ],
  
  migrations: [
    __dirname + "/migrations/*.ts",
    __dirname + "/migrations/*.js"
  ],
  
  subscribers: [],
});