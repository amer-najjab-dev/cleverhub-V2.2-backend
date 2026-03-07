import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Supplier } from './Supplier';
import { Product } from './Product';

@Entity('product_purchases')
export class ProductPurchase {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'supplier_id', type: 'varchar', length: 255 })
  supplierId: string;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate: Date;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'price_pph', type: 'decimal', precision: 10, scale: 2 })
  pricePPH: number;

  @Column({ name: 'previous_pph', type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousPPH: number;

  @Column({ name: 'batch_number', type: 'varchar', length: 100, nullable: true })
  batchNumber: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'delivery_note_id', type: 'varchar', length: 50, nullable: true })
  deliveryNoteId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Supplier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
