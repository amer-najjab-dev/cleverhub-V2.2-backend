import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './Sale';
import { Product } from './Product';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_id' })
  saleId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_ppv', type: 'decimal', precision: 10, scale: 2 })
  unitPricePPV: number;

  @Column({ name: 'unit_price_pph', type: 'decimal', precision: 10, scale: 2 })
  unitPricePPH: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ name: 'lot_id', nullable: true })
  lotId: number;

  @Column({ name: 'expiration_date', nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Columnas calculadas (opcional, no se insertan)
  @Column({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true })
  margin: number;

  @Column({ name: 'margin_percentage', type: 'decimal', precision: 5, scale: 2, insert: false, select: true })
  marginPercentage: number;

  @ManyToOne(() => Sale, sale => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product, product => product.saleItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
