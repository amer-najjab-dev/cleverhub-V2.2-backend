import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Supplier } from './Supplier';

@Entity('supplier_phones')
export class SupplierPhone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  number: string;

  @Column({ length: 20 })
  type: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne('Supplier', 'phones', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}