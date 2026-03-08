// backend/src/entities/AIGeneratedMessage.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';
import { User } from './User';

@Entity('ai_generated_messages')
export class AIGeneratedMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  tone: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'points_cost', nullable: true, type: 'int' })  // ✅ Añadido nullable: true
  pointsCost: number | null;

  @Column({ name: 'usage_count', default: 0 })
  usageCount: number;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number | null;  // ✅ Cambiado a nullable

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}