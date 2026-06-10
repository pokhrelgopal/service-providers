import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { UsersService, type GoogleProfile } from '../users/users.service';
import { User } from '../users/user.entity';
import type { Env } from '../config/env.validation';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.interface';

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

interface IssuedSession {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private get refreshTtlSeconds(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 86_400;
  }

  private sessionKey(userId: string, sid: string): string {
    return `session:${userId}:${sid}`;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  loginWithGoogle(profile: GoogleProfile): Promise<User> {
    return this.users.findOrCreateFromGoogle(profile);
  }

  /** Email + password login (used by admin accounts). */
  async loginWithPassword(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');
    return user;
  }

  private signAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('ACCESS_TOKEN_TTL', { infer: true }),
    });
  }

  private signRefreshToken(userId: string, sid: string): string {
    const payload: RefreshTokenPayload = { sub: userId, sid };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.config.get('REFRESH_TOKEN_TTL', { infer: true }),
    });
  }

  /** Create a new session (one per device/login) and issue both tokens. */
  async issueSession(user: User, meta: SessionMeta): Promise<IssuedSession> {
    const sid = randomUUID();
    const refreshToken = this.signRefreshToken(user.id, sid);
    await this.persistSession(user.id, sid, refreshToken, meta);
    return { accessToken: this.signAccessToken(user), refreshToken };
  }

  private async persistSession(
    userId: string,
    sid: string,
    refreshToken: string,
    meta: SessionMeta,
  ): Promise<void> {
    await this.redis.set(
      this.sessionKey(userId, sid),
      JSON.stringify({
        tokenHash: this.hash(refreshToken),
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      }),
      'EX',
      this.refreshTtlSeconds,
    );
  }

  /**
   * Validate + rotate a refresh token. Issues a new access + refresh pair and
   * invalidates the old refresh token. If a stored session is missing or the
   * presented token doesn't match the stored hash (reuse/theft), the session is
   * revoked and the request rejected.
   */
  async rotate(
    refreshToken: string,
    meta: SessionMeta,
  ): Promise<IssuedSession & { user: User }> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = this.sessionKey(payload.sub, payload.sid);
    const stored = await this.redis.get(key);
    if (!stored) throw new UnauthorizedException('Session expired');

    const { tokenHash } = JSON.parse(stored) as { tokenHash: string };
    if (tokenHash !== this.hash(refreshToken)) {
      // Token reuse detected — revoke the whole session.
      await this.redis.del(key);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      await this.redis.del(key);
      throw new UnauthorizedException('User no longer exists');
    }

    const newRefresh = this.signRefreshToken(user.id, payload.sid);
    await this.persistSession(user.id, payload.sid, newRefresh, meta);
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: newRefresh,
      user,
    };
  }

  /** Revoke a single session (this-device logout). Best-effort. */
  async revokeFromToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
      await this.redis.del(this.sessionKey(payload.sub, payload.sid));
    } catch {
      // Already invalid/expired — nothing to revoke.
    }
  }

  /** Revoke every session for a user (all-devices logout). */
  async revokeAll(userId: string): Promise<void> {
    const pattern = this.sessionKey(userId, '*');
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = next;
      if (keys.length) await this.redis.del(...keys);
    } while (cursor !== '0');
  }
}
