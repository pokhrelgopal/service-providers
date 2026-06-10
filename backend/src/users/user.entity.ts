import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  /** Google subject id — set for Google-authenticated users. */
  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  googleId!: string | null;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  /** bcrypt hash — only set for password accounts (e.g. admins). Not selected
   * by default; load explicitly when authenticating. */
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash!: string | null;

  /** Role *set*; empty until the user picks a path during onboarding (M3). */
  @Column({ type: 'enum', enum: UserRole, array: true, default: [] })
  roles!: UserRole[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
