// backend/src/entities/ClientConsent.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './Client';

@Entity('client_consent')
export class ClientConsent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id', unique: true })
  clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ default: true })
  whatsapp: boolean;

  @Column({ default: true })
  email: boolean;

  @Column({ default: true })
  sms: boolean;

  @Column({ name: 'unsubscribed_at', nullable: true, type: 'timestamp' })
  unsubscribedAt: Date;

  @Column({ name: 'unsubscribe_reason', nullable: true, type: 'text' })
  unsubscribeReason: string;

  @Column({ name: 'unsubscribe_token', nullable: true, length: 100, unique: true })
  unsubscribeToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}