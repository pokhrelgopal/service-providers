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
import { Skill } from '../skills/skill.entity';
import { ServiceRequestStatus } from './service-request-status.enum';
import { ServiceRequestResponse } from './service-request-response.entity';

/** A seeker's broadcast: "I need <skill> here, within <radius>m — <description>".
 * Visible to matching available providers within the radius until it expires. */
@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  seekerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seekerId' })
  seeker?: User;

  @Column('uuid')
  skillId!: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill?: Skill;

  @Column('text')
  description!: string;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  /** Seeker-chosen broadcast radius, in metres. */
  @Column('int')
  radius!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.OPEN,
  })
  status!: ServiceRequestStatus;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @OneToMany(() => ServiceRequestResponse, (r) => r.request)
  responses?: ServiceRequestResponse[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
