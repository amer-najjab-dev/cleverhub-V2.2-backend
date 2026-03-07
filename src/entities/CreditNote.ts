import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Supplier } from './Supplier';

@Entity('credit_notes')
export class CreditNote {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'supplier_id', type: 'varchar', length: 255 })
  supplierId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'used_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedAmount: number;

  @Column({ name: 'remaining_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'varchar', length: 50 })
  reason: string;

  @Column({ name: 'linked_bl', type: 'varchar', length: 50, nullable: true })
  linkedBL: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Supplier, supplier => supplier.creditNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
