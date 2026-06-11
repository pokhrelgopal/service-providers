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
import { Engagement } from './engagement.entity';

/** A chat message within an engagement. Minimal by design — no edits, no
 * deletes; just who said what, when. */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  engagementId!: string;

  @ManyToOne(() => Engagement, (e) => e.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'engagementId' })
  engagement?: Engagement;

  @Column('uuid')
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender?: User;

  @Column('text')
  body!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
