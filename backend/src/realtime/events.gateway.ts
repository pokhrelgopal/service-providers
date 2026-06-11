import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { Env } from '../config/env.validation';
import type { AccessTokenPayload } from '../auth/types/jwt-payload.interface';

interface SocketData {
  userId?: string;
}

/** Shared JWT-authenticated Socket.IO gateway. Other services emit to specific
 * users via {@link emitToUsers}; clients only ever receive their own events. */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly online = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      (socket.data as SocketData).userId = payload.sub;
      this.track(payload.sub, socket.id);
      await socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    const userId = (socket.data as SocketData).userId;
    if (userId) this.untrack(userId, socket.id);
  }

  /** Emit an event to every live socket of each given user. */
  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    const rooms = userIds.map((id) => `user:${id}`);
    if (rooms.length) this.server.to(rooms).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  isOnline(userId: string): boolean {
    return this.online.has(userId);
  }

  private extractToken(socket: Socket): string {
    const auth = socket.handshake.auth as { token?: string } | undefined;
    const fromAuth = auth?.token;
    const header = socket.handshake.headers.authorization;
    const fromHeader = header?.startsWith('Bearer ')
      ? header.slice(7)
      : undefined;
    const queryToken = socket.handshake.query.token;
    const fromQuery = Array.isArray(queryToken) ? queryToken[0] : queryToken;
    const token = fromAuth ?? fromHeader ?? fromQuery;
    if (!token) throw new Error('Missing auth token');
    return token;
  }

  private track(userId: string, socketId: string): void {
    const set = this.online.get(userId) ?? new Set<string>();
    set.add(socketId);
    this.online.set(userId, set);
  }

  private untrack(userId: string, socketId: string): void {
    const set = this.online.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) this.online.delete(userId);
  }
}
