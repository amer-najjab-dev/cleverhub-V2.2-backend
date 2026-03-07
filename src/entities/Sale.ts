import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from './Client';
import { User } from './User';
import { SaleItem } from './SaleItem';
import { Payment } from './Payment';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_number', unique: true })
  saleNumber: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: number | null;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_type', nullable: true })
  discountType: string;

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'change_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  changeAmount: number;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Column({ name: 'payment_status', default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'sale_status', default: 'completed' })
  saleStatus: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'adult_flag', nullable: true })
  adultFlag: boolean;

  @Column({ name: 'pregnant_flag', nullable: true })
  pregnantFlag: boolean;

  @Column({ name: 'lactating_flag', nullable: true })
  lactatingFlag: boolean;

  @Column({ name: 'chronic_condition_flag', nullable: true })
  chronicConditionFlag: boolean;

  @Column({ name: 'usual_medication_flag', nullable: true })
  usualMedicationFlag: boolean;

  @Column({ name: 'amount_applied', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountApplied: number;

  @Column({ name: 'amount_pending', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPending: number;

  @Column({ name: 'is_debt_paid', default: false })
  isDebtPaid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Client, client => client.sales, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => SaleItem, item => item.sale, { cascade: true })
  items: SaleItem[];

  @OneToMany(() => Payment, payment => payment.sale, { cascade: true })
  payments: Payment[];
}
