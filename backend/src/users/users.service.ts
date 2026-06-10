import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
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
      where: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (existing) {
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
