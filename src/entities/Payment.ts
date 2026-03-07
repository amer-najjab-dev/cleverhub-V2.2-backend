import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './Sale';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_id' })
  saleId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ default: 'completed' })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Sale, sale => sale.payments)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;
}
