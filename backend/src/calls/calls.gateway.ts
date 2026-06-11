import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Engagement } from '../engagements/engagement.entity';
import { EngagementStatus } from '../engagements/engagement-status.enum';
import { EventsGateway } from '../realtime/events.gateway';

/** Every call signal carries the engagement it belongs to and a per-call id. */
interface Signal {
  engagementId?: string;
  callId?: string;
  sdp?: unknown;
  candidate?: unknown;
}

/**
 * Pure **signaling relay** for WebRTC calls. It forwards the small setup
 * messages (invite / accept / decline / offer / answer / ICE / end) between the
 * two people in an active engagement. It never touches audio — that flows
 * peer-to-peer once the browsers are connected.
 *
 * Authorization: the sender's `userId` (set by {@link EventsGateway} on connect)
 * must be a participant of the engagement, and the engagement must be ACTIVE.
 * The message is then delivered only to the *other* participant.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class CallsGateway {
  constructor(
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
    private readonly events: EventsGateway,
  ) {}

  @SubscribeMessage('call:invite')
  invite(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:invite');
  }

  @SubscribeMessage('call:accept')
  accept(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:accept');
  }

  @SubscribeMessage('call:decline')
  decline(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:decline');
  }

  @SubscribeMessage('call:offer')
  offer(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:offer');
  }

  @SubscribeMessage('call:answer')
  answer(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:answer');
  }

  @SubscribeMessage('call:ice')
  ice(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:ice');
  }

  @SubscribeMessage('call:end')
  end(@ConnectedSocket() c: Socket, @MessageBody() d: Signal) {
    return this.relay(c, d, 'call:end');
  }

  /** Validate the sender is a participant of the ACTIVE engagement, then forward
   * the signal to the other participant only. */
  private async relay(
    client: Socket,
    data: Signal,
    event: string,
  ): Promise<void> {
    const userId = (client.data as { userId?: string }).userId;
    if (!userId || !data?.engagementId || !data?.callId) return;

    const engagement = await this.engagements.findOne({
      where: { id: data.engagementId, status: EngagementStatus.ACTIVE },
    });
    if (!engagement) return;

    const otherId =
      engagement.seekerId === userId
        ? engagement.providerId
        : engagement.providerId === userId
          ? engagement.seekerId
          : null;
    if (!otherId) return; // sender isn't part of this engagement

    this.events.emitToUser(otherId, event, { ...data, from: userId });
  }
}
