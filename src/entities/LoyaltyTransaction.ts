import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Client } from './Client';
import { Sale } from './Sale';
import { LoyaltyReward } from './LoyaltyReward';
import { LoyaltyPack } from './LoyaltyPack';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  points: number;

  @Column({ length: 50 })
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'promotion';

  @Column({ nullable: true })
  reason: string;

  @Column({ name: 'sale_id', nullable: true })
  saleId: number;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'reward_id', nullable: true })
  rewardId: number;

  @ManyToOne(() => LoyaltyReward, { nullable: true })
  @JoinColumn({ name: 'reward_id' })
  reward: LoyaltyReward;

  @Column({ name: 'pack_id', nullable: true })
  packId: number;

  @ManyToOne(() => LoyaltyPack, { nullable: true })
  @JoinColumn({ name: 'pack_id' })
  pack: LoyaltyPack;

  @Column({ name: 'product_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  productValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}