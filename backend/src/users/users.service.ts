import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Engagement } from '../engagements/engagement.entity';
import { EngagementStatus } from '../engagements/engagement-status.enum';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

/** Days a deleted account is kept before it's permanently purged. Logging in
 * within this window reactivates it. */
export const ACCOUNT_DELETION_GRACE_DAYS = 15;

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /** Loads a user including the (normally hidden) password hash, for login. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  /** Find an existing user by Google id (or email) or create a fresh one. */
  async findOrCreateFromGoogle(profile: GoogleProfile): Promise<User> {
    const existing = await this.users.findOne({
      // Include soft-deleted rows so a returning user reactivates their account
      // instead of being handed a fresh, empty one.
      withDeleted: true,
      where: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (existing) {
      // Reactivate an account that was scheduled for deletion (clear the soft
      // delete). Logging in is the cancel signal for the 15-day purge.
      if (existing.deletedAt) existing.deletedAt = null;
      // Backfill googleId / profile details for users that pre-date this login.
      existing.googleId ??= profile.googleId;
      existing.name = existing.name || profile.name;
      existing.avatarUrl = existing.avatarUrl ?? profile.avatarUrl;
      return this.users.save(existing);
    }

    const user = this.users.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      roles: [],
    });
    return this.users.save(user);
  }

  /**
   * Soft-delete an account. The row is kept (with `deletedAt` set) so the user
   * can reactivate by logging back in within the grace window; after that it's
   * permanently purged by {@link purgeExpired}.
   *
   * Blocked while the user has a job in progress (as seeker or provider) — they
   * must finish or hand it off first.
   */
  async deleteAccount(id: string): Promise<void> {
    const activeJobs = await this.engagements.count({
      where: [
        { seekerId: id, status: EngagementStatus.ACTIVE },
        { providerId: id, status: EngagementStatus.ACTIVE },
      ],
    });
    if (activeJobs > 0) {
      throw new ConflictException(
        'You have a job in progress. Finish it before deleting your account.',
      );
    }
    await this.users.softDelete({ id });
  }

  /**
   * Permanently remove accounts that were soft-deleted longer ago than the
   * grace window. Returns how many rows were purged. Meant to be run on a
   * schedule. */
  async purgeExpired(graceDays = ACCOUNT_DELETION_GRACE_DAYS): Promise<number> {
    const cutoff = new Date(Date.now() - graceDays * 86_400_000);
    const res = await this.users.delete({ deletedAt: LessThan(cutoff) });
    return res.affected ?? 0;
  }

  /** Daily sweep that permanently removes accounts past the deletion grace
   * window. Runs every day at 03:00 server time. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredAccounts(): Promise<void> {
    const purged = await this.purgeExpired();
    if (purged > 0) {
      this.logger.log(`Purged ${purged} expired account(s).`);
    }
  }

  /** Replace a user's role set (used by onboarding in M3). */
  async setRoles(id: string, roles: UserRole[]): Promise<User | null> {
    await this.users.update({ id }, { roles });
    return this.findById(id);
  }

  /** Add a role to the user's set if not already present. */
  async addRole(id: string, role: UserRole): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    if (!user.roles.includes(role)) {
      user.roles = [...user.roles, role];
      await this.users.save(user);
    }
    return user;
  }

  /**
   * Seeker onboarding. A user can't be both a seeker and a provider, and a
   * provider can't downgrade — they'd need a new account.
   */
  async assignSeekerRole(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    if (user.roles.includes(UserRole.PROVIDER)) {
      throw new ConflictException(
        'A provider account cannot switch to a seeker. Please create a new account.',
      );
    }
    return this.addRole(id, UserRole.SEEKER);
  }

  /**
   * Promote to provider on application submit. Seeker and provider are mutually
   * exclusive, so any seeker role is replaced (admin is preserved).
   */
  async promoteToProvider(id: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    const roles = new Set(user.roles);
    roles.delete(UserRole.SEEKER);
    roles.add(UserRole.PROVIDER);
    user.roles = [...roles];
    await this.users.save(user);
    return user;
  }
}
