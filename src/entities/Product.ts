import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SaleItem } from './SaleItem';
import { PriceHistory } from './PriceHistory';
import { InventoryLot } from './InventoryLot';
import { StockMovement } from './StockMovement';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'pricePPV', type: 'decimal', precision: 10, scale: 2 })
  pricePPV: number;

  @Column({ name: 'pricePPH', type: 'decimal', precision: 10, scale: 2 })
  pricePPH: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  category: string;

  @Column({ unique: true, nullable: true })
  sku: string;

  @Column({ name: 'imageUrl', nullable: true })
  imageUrl: string;

  @Column({ name: 'expirationDate', nullable: true })
  expirationDate: Date;

    // NUEVOS CAMPOS (añade estas líneas)
  @Column({ length: 50, nullable: true })
  dosageForm?: string;

  @Column({ length: 100, nullable: true, unique: true }) // unique opcional
  barcode?: string;

  @Column({ length: 50, nullable: true })
  zone?: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => SaleItem, saleItem => saleItem.product)
  saleItems: SaleItem[];

  @Column({ length: 100, nullable: true })
  laboratory?: string;

  @Column({ default: false })
  prescription: boolean;

  // Nota: en la BD está en minúsculas
  @Column('text', { nullable: true, name: 'posologyadult' })
  posologyAdult?: string;

  @Column('text', { nullable: true, name: 'posologychild' })
  posologyChild?: string;

  @Column('text', { nullable: true })
  contraindications?: string;

  @Column('text', { nullable: true })
  monograph?: string;

  @OneToMany(() => PriceHistory, priceHistory => priceHistory.product)
  priceHistories: PriceHistory[];

  @OneToMany(() => InventoryLot, inventoryLot => inventoryLot.product)
  inventoryLots: InventoryLot[];

  @OneToMany(() => StockMovement, stockMovement => stockMovement.product)
  stockMovements: StockMovement[];
}
