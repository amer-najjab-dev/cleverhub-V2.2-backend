import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Product } from './Product';
import { StockMovement } from './StockMovement';

@Entity('inventory_lots')
export class InventoryLot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, product => product.inventoryLots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 100, name: 'batch_number' })
  batchNumber: string;

  @Column({ type: 'date', name: 'expiry_date' })
  expiryDate: Date;

  @Column()
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => StockMovement, stockMovement => stockMovement.lot)
  stockMovements: StockMovement[];
}