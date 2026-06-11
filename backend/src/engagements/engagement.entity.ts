import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceRequest } from '../requests/service-request.entity';
import { EngagementStatus } from './engagement-status.enum';
import { Message } from './message.entity';

/** An accepted 1-to-1 working relationship: seeker A picked provider B for a
 * request. Both are locked (no new broadcasts / matches) until completed. */
@Entity('engagements')
export class Engagement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  requestId!: string;

  @ManyToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request?: ServiceRequest;

  @Column('uuid')
  seekerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seekerId' })
  seeker?: User;

  @Column('uuid')
  providerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: User;

  @Index()
  @Column({
    type: 'enum',
    enum: EngagementStatus,
    default: EngagementStatus.ACTIVE,
  })
  status!: EngagementStatus;

  /** Last time each side opened the chat (drives the unread badge). */
  @Column({ type: 'timestamptz', nullable: true })
  seekerReadAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  providerReadAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @OneToMany(() => Message, (m) => m.engagement)
  messages?: Message[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
