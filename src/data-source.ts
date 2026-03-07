import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Product } from './entities/Product';
import { PriceHistory } from './entities/PriceHistory';
import { InventoryLot } from './entities/InventoryLot';
import { StockMovement } from './entities/StockMovement';

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "admin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cleverhub_db",
  
  // IMPORTANTE: Desactivar synchronize si ya tienes las tablas
  synchronize: false,  // Cambiar a false ya que las tablas ya existen
  
  // O si quieres que TypeORM cree typeorm_metadata automáticamente:
  // synchronize: true,
  
  logging: ['query', 'error'],
  
  // Cargar todas las entidades
  entities: [
    __dirname + "/entities/*.ts",
    __dirname + "/entities/*.js"
  ],
  
  migrations: [
    __dirname + "/migrations/*.ts",
    __dirname + "/migrations/*.js"
  ],
  
  subscribers: [],
  
  // Opcional: Desactivar metadatos de columnas generadas
  // metadataTableName: false,
});
