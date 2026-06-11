import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Skill } from '../skills/skill.entity';
import { Document } from './document.entity';
import { ProviderStatus } from './provider-status.enum';

@Entity('provider_profiles')
export class ProviderProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column('uuid')
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Full legal name as on citizenship — may differ from display name. */
  @Column({ type: 'varchar', nullable: true })
  legalName!: string | null;

  @Column({ type: 'varchar', default: 'NP' })
  phoneCountry!: string;

  @Column({ type: 'varchar', default: '+977' })
  phoneDialCode!: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string | null;

  @Column({ default: false })
  phoneVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  serviceDescription!: string | null;

  /** Published discovery location (provider's exact GPS — no manual pin). */
  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  /** Provider can manually toggle themselves off the map. */
  @Column({ default: true })
  isAvailable!: boolean;

  /** Denormalized review aggregate (immutable reviews → sum/count is exact). */
  @Column({ type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ type: 'int', default: 0 })
  ratingSum!: number;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.DRAFT })
  status!: ProviderStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @ManyToMany(() => Skill, { cascade: false })
  @JoinTable({ name: 'provider_profile_skills' })
  skills!: Skill[];

  @OneToMany(() => Document, (d) => d.providerProfile)
  documents!: Document[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
