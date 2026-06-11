import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Engagement } from '../engagements/engagement.entity';

/** A seeker's rating + review of a provider after a completed engagement.
 * One per engagement, immutable. */
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  engagementId!: string;

  @ManyToOne(() => Engagement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'engagementId' })
  engagement?: Engagement;

  @Column('uuid')
  seekerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seekerId' })
  seeker?: User;

  @Index()
  @Column('uuid')
  providerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: User;

  /** 1–5. */
  @Column('int')
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
