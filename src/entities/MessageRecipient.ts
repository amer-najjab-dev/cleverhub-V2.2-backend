// backend/src/entities/MessageRecipient.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './Client';
import { MessageCampaign } from './MessageCampaign';
import { Sale } from './Sale';

@Entity('message_recipients')
export class MessageRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'campaign_id' })
  campaignId: number;

  @ManyToOne(() => MessageCampaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: MessageCampaign;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'sent_at', nullable: true, type: 'timestamp' })
  sentAt: Date;

  @Column({ name: 'delivered_at', nullable: true, type: 'timestamp' })
  deliveredAt: Date;

  @Column({ name: 'read_at', nullable: true, type: 'timestamp' })
  readAt: Date;

  @Column({ name: 'converted_at', nullable: true, type: 'timestamp' })
  convertedAt: Date;

  @Column({ name: 'conversion_sale_id', nullable: true })
  conversionSaleId: number;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'conversion_sale_id' })
  conversionSale: Sale;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}