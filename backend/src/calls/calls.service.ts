import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

@Injectable()
export class CallsService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * ICE servers for the browser's `RTCPeerConnection`:
   *  - STUN (always) — lets a peer discover its public address.
   *  - TURN (when configured) — relay fallback, with **short-lived** credentials
   *    minted here via HMAC over `"<expiry>:<userId>"` using the shared
   *    `TURN_SECRET`. This is coturn's `use-auth-secret` scheme: no per-user
   *    passwords are stored, and a leaked credential expires on its own.
   */
  getIceServers(userId: string): { iceServers: IceServer[] } {
    const iceServers: IceServer[] = [];

    const stunUrls = this.splitUrls(
      this.config.get('STUN_URLS', { infer: true }),
    );
    if (stunUrls.length) iceServers.push({ urls: stunUrls });

    const turnUrls = this.splitUrls(
      this.config.get('TURN_URLS', { infer: true }),
    );
    const secret = this.config.get('TURN_SECRET', { infer: true });
    if (turnUrls.length && secret) {
      const ttl = this.config.get('TURN_TTL', { infer: true });
      const expiry = Math.floor(Date.now() / 1000) + ttl;
      const username = `${expiry}:${userId}`;
      const credential = createHmac('sha1', secret)
        .update(username)
        .digest('base64');
      iceServers.push({ urls: turnUrls, username, credential });
    }

    return { iceServers };
  }

  private splitUrls(value?: string): string[] {
    return (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
