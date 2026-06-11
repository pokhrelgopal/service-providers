import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { ProvidersService } from '../providers/providers.service';
import { RequestsService } from '../requests/requests.service';
import { ServiceRequest } from '../requests/service-request.entity';
import { ServiceRequestResponse } from '../requests/service-request-response.entity';
import { ServiceRequestStatus } from '../requests/service-request-status.enum';
import { EventsGateway } from '../realtime/events.gateway';
import { Engagement } from './engagement.entity';
import { EngagementStatus } from './engagement-status.enum';
import { Message } from './message.entity';
import { AcceptDto } from './dto/accept.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class EngagementsService {
  constructor(
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(ServiceRequestResponse)
    private readonly responses: Repository<ServiceRequestResponse>,
    private readonly providers: ProvidersService,
    private readonly requestsService: RequestsService,
    private readonly gateway: EventsGateway,
  ) {}

  /** Seeker accepts one provider who offered → opens an engagement, locks both,
   * and clears the request from every other provider's map. */
  async accept(seekerId: string, dto: AcceptDto) {
    const request = await this.requests.findOne({
      where: { id: dto.requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.seekerId !== seekerId) throw new ForbiddenException();
    if (
      request.status !== ServiceRequestStatus.OPEN ||
      request.expiresAt <= new Date()
    ) {
      throw new BadRequestException('This request is no longer open');
    }

    const offered = await this.responses.findOne({
      where: { requestId: dto.requestId, providerId: dto.providerId },
    });
    if (!offered) {
      throw new BadRequestException('That provider has not offered to help');
    }

    if (await this.hasActive('seekerId', seekerId)) {
      throw new BadRequestException('You already have an active job');
    }
    if (await this.hasActive('providerId', dto.providerId)) {
      throw new BadRequestException('That provider just became unavailable');
    }

    const engagement = await this.engagements.save(
      this.engagements.create({
        requestId: dto.requestId,
        seekerId,
        providerId: dto.providerId,
        status: EngagementStatus.ACTIVE,
      }),
    );

    await this.requestsService.markFulfilled(dto.requestId);
    this.gateway.emitToUsers([seekerId, dto.providerId], 'engagement:started', {
      id: engagement.id,
    });

    return this.view(engagement.id, seekerId);
  }

  /** The current user's active engagement (or null). */
  async active(userId: string) {
    const e = await this.engagements.findOne({
      where: [
        { seekerId: userId, status: EngagementStatus.ACTIVE },
        { providerId: userId, status: EngagementStatus.ACTIVE },
      ],
    });
    return e ? this.view(e.id, userId) : null;
  }

  /** Seeker marks the job done → unlocks both. */
  async complete(engagementId: string, userId: string) {
    const e = await this.engagements.findOne({ where: { id: engagementId } });
    if (!e) throw new NotFoundException('Engagement not found');
    if (e.seekerId !== userId) {
      throw new ForbiddenException('Only the seeker can complete the job');
    }
    if (e.status === EngagementStatus.ACTIVE) {
      e.status = EngagementStatus.COMPLETED;
      e.completedAt = new Date();
      await this.engagements.save(e);
      this.gateway.emitToUsers([e.seekerId, e.providerId], 'engagement:ended', {
        id: e.id,
      });
    }
    return { ok: true };
  }

  async listMessages(engagementId: string, userId: string) {
    await this.assertParticipant(engagementId, userId);
    const msgs = await this.messages.find({
      where: { engagementId },
      order: { createdAt: 'ASC' },
      take: 200,
    });
    return msgs.map((m) => this.presentMessage(m, userId));
  }

  async send(engagementId: string, userId: string, dto: SendMessageDto) {
    const e = await this.assertParticipant(engagementId, userId);
    if (e.status !== EngagementStatus.ACTIVE) {
      throw new BadRequestException('This conversation is closed');
    }
    const msg = await this.messages.save(
      this.messages.create({ engagementId, senderId: userId, body: dto.body }),
    );
    const otherId = e.seekerId === userId ? e.providerId : e.seekerId;
    this.gateway.emitToUser(otherId, 'message:new', {
      engagementId,
      message: this.presentMessage(msg, otherId),
    });
    return this.presentMessage(msg, userId);
  }

  /** Mark the conversation read up to now for the current user. */
  async markRead(engagementId: string, userId: string) {
    const e = await this.assertParticipant(engagementId, userId);
    if (e.seekerId === userId) e.seekerReadAt = new Date();
    else e.providerReadAt = new Date();
    await this.engagements.save(e);
    return { ok: true };
  }

  // ---- internals ----

  private async hasActive(
    column: 'seekerId' | 'providerId',
    userId: string,
  ): Promise<boolean> {
    const count = await this.engagements.count({
      where: { [column]: userId, status: EngagementStatus.ACTIVE },
    });
    return count > 0;
  }

  private async assertParticipant(
    engagementId: string,
    userId: string,
  ): Promise<Engagement> {
    const e = await this.engagements.findOne({ where: { id: engagementId } });
    if (!e) throw new NotFoundException('Engagement not found');
    if (e.seekerId !== userId && e.providerId !== userId) {
      throw new ForbiddenException();
    }
    return e;
  }

  /** Build the per-user view: the *other* person + unread state. */
  private async view(engagementId: string, userId: string) {
    const e = await this.engagements.findOne({
      where: { id: engagementId },
      relations: { seeker: true, provider: true },
    });
    if (!e) throw new NotFoundException('Engagement not found');

    const isSeeker = e.seekerId === userId;
    const other: User | undefined = isSeeker ? e.provider : e.seeker;

    // The other person's photo: provider → verified selfie, seeker → avatar.
    let avatarUrl = other?.avatarUrl ?? null;
    if (isSeeker && other) {
      const selfies = await this.providers.getSelfieUrlsByUserIds([other.id]);
      avatarUrl = selfies.get(other.id) ?? null;
    }

    return {
      id: e.id,
      status: e.status,
      role: isSeeker ? 'seeker' : 'provider',
      other: other ? { id: other.id, name: other.name, avatarUrl } : null,
      unread: await this.computeUnread(e, isSeeker),
      createdAt: e.createdAt,
    };
  }

  private async computeUnread(
    e: Engagement,
    isSeeker: boolean,
  ): Promise<boolean> {
    const myReadAt = isSeeker ? e.seekerReadAt : e.providerReadAt;
    const otherId = isSeeker ? e.providerId : e.seekerId;
    const where: FindOptionsWhere<Message> = {
      engagementId: e.id,
      senderId: otherId,
    };
    if (myReadAt) where.createdAt = MoreThan(myReadAt);
    return (await this.messages.count({ where })) > 0;
  }

  private presentMessage(m: Message, userId: string) {
    return {
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === userId,
    };
  }
}
