import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './Product';

@Entity('loyalty_packs')
export class LoyaltyPack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'points_cost' })
  pointsCost: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'max_quantity', nullable: true })
  maxQuantity: number;

  @Column({ name: 'start_date', nullable: true, type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', nullable: true, type: 'timestamp' })
  endDate: Date;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'loyalty_pack_products',
    joinColumn: { name: 'pack_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' }
  })
  products: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}