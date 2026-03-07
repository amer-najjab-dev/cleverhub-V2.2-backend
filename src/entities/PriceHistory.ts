import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, product => product.priceHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column('decimal', { precision: 10, scale: 2, name: 'priceppv' })
  pricePPV: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'pricepph' })
  pricePPH: number;
}