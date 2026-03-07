import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('loyalty_config')
export class LoyaltyConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'points_per_unit', default: 1 })
  pointsPerUnit: number; // Puntos por cada unidad de moneda

  @Column({ name: 'currency_unit', default: 10 })
  currencyUnit: number; // Unidad de moneda (ej: 10 MAD)

  @Column({ name: 'min_purchase_for_points', default: 0, type: 'decimal', precision: 10, scale: 2 })
  minPurchaseForPoints: number; // Compra mínima para acumular puntos

  @Column({ name: 'points_expiry_days', default: 365 })
  pointsExpiryDays: number; // Días de validez de los puntos

  @Column({ name: 'welcome_points', default: 100 })
  welcomePoints: number; // Puntos de bienvenida para nuevos clientes

  @Column({ name: 'birthday_multiplier', default: 2, type: 'decimal', precision: 3, scale: 1 })
  birthdayMultiplier: number; // Multiplicador en el cumpleaños (2x, 3x, etc.)

  @Column({ name: 'first_purchase_multiplier', default: 1.5, type: 'decimal', precision: 3, scale: 1 })
  firstPurchaseMultiplier: number; // Multiplicador primera compra

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'tier_thresholds', type: 'jsonb', nullable: true })
  tierThresholds: {
    bronze: { min: number; max: number };
    argent: { min: number; max: number };
    or: { min: number; max: number };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}