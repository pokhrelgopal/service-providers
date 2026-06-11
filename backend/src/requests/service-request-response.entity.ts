import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceRequest } from './service-request.entity';

/** A provider raising their hand ("I can help") on a broadcast request. */
@Entity('service_request_responses')
@Unique(['requestId', 'providerId'])
export class ServiceRequestResponse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  requestId!: string;

  @ManyToOne(() => ServiceRequest, (r) => r.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request?: ServiceRequest;

  /** The responding provider's user id. */
  @Column('uuid')
  providerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
