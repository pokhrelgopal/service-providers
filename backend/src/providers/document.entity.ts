import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentType } from './document-type.enum';
import { ProviderProfile } from './provider-profile.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  providerProfileId!: string;

  @ManyToOne(() => ProviderProfile, (p) => p.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerProfileId' })
  providerProfile?: ProviderProfile;

  @Column({ type: 'enum', enum: DocumentType })
  type!: DocumentType;

  /** MinIO object key (private — served via presigned GET only). */
  @Column()
  objectKey!: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailKey!: string | null;

  @Column()
  mimeType!: string;

  @Column({ type: 'int' })
  sizeBytes!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
