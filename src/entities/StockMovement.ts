import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';
import { InventoryLot } from './InventoryLot';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, product => product.stockMovements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => InventoryLot, lot => lot.stockMovements, { nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot?: InventoryLot;

  @Column({ length: 20 })
  type: 'vente' | 'achat' | 'retour' | 'ajustement';

  @Column()
  quantity: number;

  @Column({ name: 'stock_after' })
  stockAfter: number;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}