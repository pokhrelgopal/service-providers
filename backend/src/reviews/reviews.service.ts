import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { decodeCursor, encodeCursor } from '../common/pagination';
import { ProviderProfile } from '../providers/provider-profile.entity';
import { ProvidersService } from '../providers/providers.service';
import { Engagement } from '../engagements/engagement.entity';
import { EngagementStatus } from '../engagements/engagement-status.enum';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
    @InjectRepository(ProviderProfile)
    private readonly profiles: Repository<ProviderProfile>,
    private readonly providers: ProvidersService,
  ) {}

  /** Seeker reviews the provider after a completed engagement (once). */
  async create(seekerId: string, dto: CreateReviewDto) {
    const eng = await this.engagements.findOne({
      where: { id: dto.engagementId },
    });
    if (!eng) throw new NotFoundException('Engagement not found');
    if (eng.seekerId !== seekerId) throw new ForbiddenException();
    if (eng.status !== EngagementStatus.COMPLETED) {
      throw new BadRequestException('You can only review a completed job');
    }
    const existing = await this.reviews.findOne({
      where: { engagementId: eng.id },
    });
    if (existing)
      throw new BadRequestException('You already reviewed this job');

    const review = await this.reviews.save(
      this.reviews.create({
        engagementId: eng.id,
        seekerId,
        providerId: eng.providerId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      }),
    );

    // Bump the provider's denormalized aggregate.
    const profile = await this.profiles.findOne({
      where: { userId: eng.providerId },
    });
    if (profile) {
      profile.ratingCount += 1;
      profile.ratingSum += dto.rating;
      await this.profiles.save(profile);
    }

    return { id: review.id };
  }

  /** The seeker's most recent completed engagement still awaiting a review. */
  async pending(seekerId: string) {
    const eng = await this.engagements.findOne({
      where: { seekerId, status: EngagementStatus.COMPLETED },
      order: { completedAt: 'DESC' },
      relations: { provider: true },
    });
    if (!eng) return null;
    const reviewed = await this.reviews.findOne({
      where: { engagementId: eng.id },
    });
    if (reviewed) return null;

    const selfies = await this.providers.getSelfieUrlsByUserIds([
      eng.providerId,
    ]);
    return {
      engagementId: eng.id,
      provider: {
        id: eng.providerId,
        name: eng.provider?.name ?? null,
        avatarUrl:
          selfies.get(eng.providerId) ?? eng.provider?.avatarUrl ?? null,
      },
    };
  }

  /** Reviews received by a provider (their Reviews page), newest first and
   * cursor-paginated. The aggregate `average`/`count` come from the provider's
   * denormalized totals, so the header stays correct regardless of paging. */
  async received(providerUserId: string, limit: number, cursor?: string) {
    const take = Math.min(Math.max(limit, 1), 50);
    const c = decodeCursor(cursor);

    const qb = this.reviews
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.seeker', 'seeker')
      .where('r.providerId = :providerUserId', { providerUserId })
      .orderBy('r.createdAt', 'DESC')
      .addOrderBy('r.id', 'DESC')
      .take(take + 1);

    if (c) {
      qb.andWhere('(r.createdAt < :t OR (r.createdAt = :t AND r.id < :id))', {
        t: new Date(c.t),
        id: c.id,
      });
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;

    const profile = await this.profiles.findOne({
      where: { userId: providerUserId },
    });
    const count = profile?.ratingCount ?? 0;
    const average =
      count > 0 ? Math.round((profile!.ratingSum / count) * 10) / 10 : null;

    const items = pageRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      seeker: r.seeker
        ? {
            id: r.seeker.id,
            name: r.seeker.name,
            avatarUrl: r.seeker.avatarUrl ?? null,
          }
        : null,
    }));

    const last = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ t: last.createdAt.toISOString(), id: last.id })
        : null;

    return { items, nextCursor, average, count };
  }
}
