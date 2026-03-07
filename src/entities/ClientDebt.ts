import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Client } from './Client';

@Entity('client_debts')
export class ClientDebt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @Column({ name: 'total_debt', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDebt: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'pending_amount', type: 'decimal', precision: 10, scale: 2, generatedType: 'STORED', asExpression: 'total_debt - paid_amount' })
  pendingAmount: number;

  @Column({ name: 'last_payment_date', nullable: true })
  lastPaymentDate: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
