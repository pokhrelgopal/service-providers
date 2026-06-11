import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, MoreThan, Repository } from 'typeorm';

import { randomUUID } from 'node:crypto';

import { User } from '../users/user.entity';
import { ProvidersService } from '../providers/providers.service';
import { RequestsService } from '../requests/requests.service';
import { ServiceRequest } from '../requests/service-request.entity';
import { ServiceRequestResponse } from '../requests/service-request-response.entity';
import { ServiceRequestStatus } from '../requests/service-request-status.enum';
import { StorageService } from '../storage/storage.service';
import { EventsGateway } from '../realtime/events.gateway';
import { Page, decodeCursor, encodeCursor } from '../common/pagination';
import { Review } from '../reviews/review.entity';
import { Engagement } from './engagement.entity';
import { EngagementStatus } from './engagement-status.enum';
import { Message } from './message.entity';
import { AcceptDto } from './dto/accept.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { PresignImageDto } from './dto/presign-image.dto';

const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class EngagementsService {
  constructor(
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(ServiceRequestResponse)
    private readonly responses: Repository<ServiceRequestResponse>,
    private readonly providers: ProvidersService,
    private readonly requestsService: RequestsService,
    private readonly storage: StorageService,
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

  /** The seeker's past jobs (completed engagements), newest first, each with
   * the provider and the review the seeker left (if any). */
  async history(seekerId: string) {
    const rows = await this.engagements.find({
      where: { seekerId, status: EngagementStatus.COMPLETED },
      order: { completedAt: 'DESC' },
      relations: { provider: true, request: { skill: true } },
      take: 100,
    });
    if (!rows.length) return [];

    const providerIds = [...new Set(rows.map((e) => e.providerId))];
    const selfies = await this.providers.getSelfieUrlsByUserIds(providerIds);
    const reviews = await this.reviews.find({
      where: { engagementId: In(rows.map((e) => e.id)) },
    });
    const reviewByEngagement = new Map(reviews.map((r) => [r.engagementId, r]));

    return rows.map((e) => {
      const review = reviewByEngagement.get(e.id);
      return {
        engagementId: e.id,
        requestId: e.requestId,
        skill: e.request?.skill?.name ?? null,
        description: e.request?.description ?? null,
        createdAt: e.createdAt,
        completedAt: e.completedAt,
        provider: e.provider
          ? {
              id: e.provider.id,
              name: e.provider.name,
              avatarUrl:
                selfies.get(e.provider.id) ?? e.provider.avatarUrl ?? null,
            }
          : null,
        review: review
          ? {
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
            }
          : null,
      };
    });
  }

  /** A provider's completed jobs, newest first, cursor-paginated. Each item
   * carries the seeker, the skill/details, and the rating the seeker left. */
  async completedJobs(
    providerId: string,
    limit: number,
    cursor?: string,
  ): Promise<Page<unknown>> {
    const take = Math.min(Math.max(limit, 1), 50);
    const c = decodeCursor(cursor);

    const qb = this.engagements
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.seeker', 'seeker')
      .leftJoinAndSelect('e.request', 'request')
      .leftJoinAndSelect('request.skill', 'skill')
      .where('e.providerId = :providerId', { providerId })
      .andWhere('e.status = :status', { status: EngagementStatus.COMPLETED })
      .orderBy('e.completedAt', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .take(take + 1);

    if (c) {
      qb.andWhere(
        '(e.completedAt < :t OR (e.completedAt = :t AND e.id < :id))',
        { t: new Date(c.t), id: c.id },
      );
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;

    // Ratings the seekers left for these jobs (so the provider sees them).
    const reviews = pageRows.length
      ? await this.reviews.find({
          where: { engagementId: In(pageRows.map((e) => e.id)) },
        })
      : [];
    const reviewByEngagement = new Map(reviews.map((r) => [r.engagementId, r]));

    const items = pageRows.map((e) => {
      const review = reviewByEngagement.get(e.id);
      return {
        engagementId: e.id,
        skill: e.request?.skill?.name ?? null,
        description: e.request?.description ?? null,
        createdAt: e.createdAt,
        completedAt: e.completedAt,
        seeker: e.seeker
          ? {
              id: e.seeker.id,
              name: e.seeker.name,
              avatarUrl: e.seeker.avatarUrl ?? null,
            }
          : null,
        review: review
          ? { rating: review.rating, comment: review.comment }
          : null,
      };
    });

    const last = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && last?.completedAt
        ? encodeCursor({ t: last.completedAt.toISOString(), id: last.id })
        : null;

    return { items, nextCursor };
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
    return Promise.all(msgs.map((m) => this.presentMessage(m, userId)));
  }

  /** Presign a PUT URL for a chat image; the client uploads then sends a
   * message referencing the returned key. */
  async presignImage(
    engagementId: string,
    userId: string,
    dto: PresignImageDto,
  ) {
    const e = await this.assertParticipant(engagementId, userId);
    if (e.status !== EngagementStatus.ACTIVE) {
      throw new BadRequestException('This conversation is closed');
    }
    const ext = IMAGE_EXT[dto.contentType];
    const key = `chat/${engagementId}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.presignedPut(key);
    return { uploadUrl, key };
  }

  async send(engagementId: string, userId: string, dto: SendMessageDto) {
    const e = await this.assertParticipant(engagementId, userId);
    if (e.status !== EngagementStatus.ACTIVE) {
      throw new BadRequestException('This conversation is closed');
    }
    const body = dto.body?.trim() || null;
    if (!body && !dto.imageKey) {
      throw new BadRequestException('Message is empty');
    }
    const msg = await this.messages.save(
      this.messages.create({
        engagementId,
        senderId: userId,
        body,
        imageKey: dto.imageKey ?? null,
      }),
    );
    const otherId = e.seekerId === userId ? e.providerId : e.seekerId;
    this.gateway.emitToUser(otherId, 'message:new', {
      engagementId,
      message: await this.presentMessage(msg, otherId),
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
      relations: { seeker: true, provider: true, request: true },
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
      // The seeker's location (where the provider needs to go).
      location: e.request
        ? { latitude: e.request.latitude, longitude: e.request.longitude }
        : null,
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

  private async presentMessage(m: Message, userId: string) {
    return {
      id: m.id,
      body: m.body,
      imageUrl: m.imageKey ? await this.storage.presignedGet(m.imageKey) : null,
      createdAt: m.createdAt,
      mine: m.senderId === userId,
    };
  }
}
