import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Sale } from './Sale';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  dni: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'birth_date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  allergies: string;

  @Column({ name: 'chronic_conditions', nullable: true })
  chronicConditions: string;

  @Column({ name: 'is_pregnant', default: false })
  isPregnant: boolean;

  @Column({ name: 'is_lactating', default: false })
  isLactating: boolean;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'total_purchases', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPurchases: number;

  @Column({ name: 'last_purchase_date', nullable: true })
  lastPurchaseDate: Date;

  @Column({ default: false })
  favorite: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Sale, sale => sale.client)
  sales: Sale[];
}
