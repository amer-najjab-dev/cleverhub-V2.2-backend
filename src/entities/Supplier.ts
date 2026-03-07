import { Entity, Column, OneToMany, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { CreditNote } from './CreditNote';
import { ProductPurchase } from './ProductPurchase';

@Entity('suppliers')
export class Supplier {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fax: string;

  @Column({ name: 'payment_terms', type: 'varchar', length: 100, nullable: true })
  paymentTerms: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 50, nullable: true })
  registrationNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => CreditNote, creditNote => creditNote.supplier)
  creditNotes: CreditNote[];

  @OneToMany(() => ProductPurchase, productPurchase => productPurchase.supplier)
  productPurchases: ProductPurchase[];
}
