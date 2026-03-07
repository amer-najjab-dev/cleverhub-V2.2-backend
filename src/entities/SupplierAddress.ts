import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Supplier } from './Supplier';

@Entity('supplier_addresses')
export class SupplierAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'street_number', nullable: true, length: 20 })
  streetNumber: string;

  @Column({ name: 'street_name', length: 255 })
  streetName: string;

  @Column({ length: 100 })
  city: string;

  @Column({ name: 'postal_code', nullable: true, length: 20 })
  postalCode: string;

  @Column({ length: 100, default: 'Maroc' })
  country: string;

  @Column({ nullable: true })
  complement: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne('Supplier', 'addresses', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}