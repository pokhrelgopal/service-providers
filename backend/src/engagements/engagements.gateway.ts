import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Engagement } from './engagement.entity';
import { EngagementStatus } from './engagement-status.enum';

interface JoinPayload {
  engagementId?: string;
}
interface LocationPayload {
  engagementId?: string;
  lat?: number;
  lng?: number;
}

const room = (engagementId: string) => `engagement:${engagementId}`;

/** Live-location relay. A participant joins their engagement's room (validated
 * against the DB ONCE here); subsequent location pings are relayed to the room
 * purely from in-memory room membership — no DB on the hot path. */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EngagementsGateway {
  constructor(
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
  ) {}

  @SubscribeMessage('engagement:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinPayload,
  ): Promise<void> {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId || !data?.engagementId) return;
    const e = await this.engagements.findOne({
      where: { id: data.engagementId, status: EngagementStatus.ACTIVE },
    });
    if (!e || (e.seekerId !== userId && e.providerId !== userId)) return;
    await client.join(room(e.id));
  }

  @SubscribeMessage('location:update')
  onLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationPayload,
  ): void {
    if (
      !data?.engagementId ||
      typeof data.lat !== 'number' ||
      typeof data.lng !== 'number'
    ) {
      return;
    }
    const r = room(data.engagementId);
    // Only members (validated at join time) may broadcast to the room.
    if (!client.rooms.has(r)) return;
    client.to(r).emit('engagement:location', {
      engagementId: data.engagementId,
      lat: data.lat,
      lng: data.lng,
    });
  }
}
