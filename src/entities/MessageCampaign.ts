// backend/src/entities/MessageCampaign.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MessageTemplate } from './MessageTemplate';
import { User } from './User';

@Entity('message_campaigns')
export class MessageCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'template_id' })
  templateId: number;

  @ManyToOne(() => MessageTemplate)
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate;

  @Column({ type: 'jsonb' })
  segments: any;

  @Column({ name: 'total_recipients', default: 0 })
  totalRecipients: number;

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @Column({ name: 'delivered_count', default: 0 })
  deliveredCount: number;

  @Column({ name: 'read_count', default: 0 })
  readCount: number;

  @Column({ name: 'conversion_count', default: 0 })
  conversionCount: number;

  @Column({ name: 'conversion_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  conversionValue: number;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'scheduled_for', nullable: true, type: 'timestamp' })
  scheduledFor: Date;

  @Column({ name: 'sent_at', nullable: true, type: 'timestamp' })
  sentAt: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}