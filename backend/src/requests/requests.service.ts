import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { Skill } from '../skills/skill.entity';
import { ProviderProfile } from '../providers/provider-profile.entity';
import { ProviderStatus } from '../providers/provider-status.enum';
import { ProvidersService } from '../providers/providers.service';
import { EventsGateway } from '../realtime/events.gateway';
import { Engagement } from '../engagements/engagement.entity';
import { EngagementStatus } from '../engagements/engagement-status.enum';
import { ServiceRequest } from './service-request.entity';
import { ServiceRequestResponse } from './service-request-response.entity';
import { ServiceRequestStatus } from './service-request-status.enum';
import { CreateRequestDto } from './dto/create-request.dto';

const REQUEST_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SWEEP_INTERVAL_MS = 30 * 1000; // expire-sweep cadence

@Injectable()
export class RequestsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestsService.name);
  private sweepTimer?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(ServiceRequest)
    private readonly requests: Repository<ServiceRequest>,
    @InjectRepository(ServiceRequestResponse)
    private readonly responses: Repository<ServiceRequestResponse>,
    @InjectRepository(ProviderProfile)
    private readonly profiles: Repository<ProviderProfile>,
    @InjectRepository(Skill)
    private readonly skills: Repository<Skill>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Engagement)
    private readonly engagements: Repository<Engagement>,
    private readonly providers: ProvidersService,
    private readonly gateway: EventsGateway,
  ) {}

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      void this.sweepExpired();
    }, SWEEP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /** Periodically expire open requests past their TTL and tell matching
   * providers to drop the marker / close the dialog (same as a cancel). */
  private async sweepExpired(): Promise<void> {
    try {
      const expired = await this.requests.find({
        where: {
          status: ServiceRequestStatus.OPEN,
          expiresAt: LessThanOrEqual(new Date()),
        },
      });
      for (const r of expired) {
        await this.markRemoved(r, ServiceRequestStatus.EXPIRED);
      }
    } catch (err) {
      this.logger.warn(`Expiry sweep failed: ${String(err)}`);
    }
  }

  /** Seeker broadcasts a need. Notifies matching online providers and returns
   * the request plus the matching providers to show on the seeker's map. */
  async create(seekerId: string, dto: CreateRequestDto) {
    const skill = await this.skills.findOne({ where: { slug: dto.skill } });
    if (!skill) throw new NotFoundException('Unknown service');

    // Locked into an active job → can't post a new request.
    const busy = await this.engagements.findOne({
      where: { seekerId, status: EngagementStatus.ACTIVE },
    });
    if (busy) {
      throw new BadRequestException(
        'Finish your current job before posting a new request.',
      );
    }

    // One active broadcast per seeker — supersede any previous open ones.
    await this.cancelOpenForSeeker(seekerId);

    const saved = await this.requests.save(
      this.requests.create({
        seekerId,
        skillId: skill.id,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius,
        status: ServiceRequestStatus.OPEN,
        expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
      }),
    );
    saved.skill = skill;
    const seeker = await this.users.findOne({ where: { id: seekerId } });

    // Push the live "raised hand" to every matching available provider.
    const providerUserIds = await this.matchingProviderUserIds(
      skill.id,
      dto.latitude,
      dto.longitude,
      dto.radius,
    );
    this.gateway.emitToUsers(
      providerUserIds,
      'request:new',
      this.presentForProvider(saved, seeker ?? null, null),
    );

    // Matching providers to drop on the seeker's own map.
    const providers = await this.providers.findNearby(
      dto.latitude,
      dto.longitude,
      dto.radius,
      dto.skill,
    );

    return { request: this.presentForSeeker(saved, []), providers };
  }

  /** The seeker's current open broadcast (+ responders), or null. */
  async mine(seekerId: string) {
    const r = await this.requests.findOne({
      where: { seekerId, status: ServiceRequestStatus.OPEN },
      relations: { skill: true, responses: { provider: true } },
      order: { createdAt: 'DESC' },
    });
    if (!r || r.expiresAt <= new Date()) return null;
    const responses = r.responses ?? [];
    const distances = await this.responderDistances(r);
    const photos = await this.providers.getSelfieUrlsByUserIds(
      responses.map((x) => x.providerId),
    );
    return this.presentForSeeker(r, responses, distances, photos);
  }

  /** Distance (m) from the request point to each responding provider. */
  private async responderDistances(
    r: ServiceRequest,
  ): Promise<Map<string, number>> {
    const providerIds = (r.responses ?? []).map((x) => x.providerId);
    if (!providerIds.length) return new Map();
    const rows = await this.profiles
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .addSelect(
        'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(p.latitude, p.longitude))',
        'distance',
      )
      .where('p."userId" IN (:...providerIds)', { providerIds })
      .andWhere('p.latitude IS NOT NULL AND p.longitude IS NOT NULL')
      .setParameters({ lat: r.latitude, lng: r.longitude })
      .getRawMany<{ userId: string; distance: string | number }>();
    return new Map(
      rows.map((row) => [row.userId, Math.round(Number(row.distance))]),
    );
  }

  async cancel(id: string, seekerId: string) {
    const r = await this.requests.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Request not found');
    if (r.seekerId !== seekerId) throw new ForbiddenException();
    if (r.status === ServiceRequestStatus.OPEN) await this.markRemoved(r);
    return { id, status: ServiceRequestStatus.CANCELLED };
  }

  /** Open requests this provider can serve, near them, sorted by distance. */
  async incoming(providerUserId: string) {
    const profile = await this.profiles.findOne({
      where: { userId: providerUserId },
      relations: { skills: true },
    });
    if (
      !profile ||
      profile.status !== ProviderStatus.APPROVED ||
      !profile.isAvailable ||
      profile.latitude == null ||
      profile.longitude == null
    ) {
      return [];
    }
    const skillIds = (profile.skills ?? []).map((s) => s.id);
    if (!skillIds.length) return [];

    // Locked into an active job → receives no new requests.
    const busy = await this.engagements.findOne({
      where: { providerId: providerUserId, status: EngagementStatus.ACTIVE },
    });
    if (busy) return [];

    const qb = this.requests
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.skill', 's')
      .leftJoinAndSelect('r.seeker', 'u')
      .where('r.status = :status', { status: ServiceRequestStatus.OPEN })
      .andWhere('r."expiresAt" > now()')
      .andWhere('r."skillId" IN (:...skillIds)', { skillIds })
      .andWhere(
        'earth_distance(ll_to_earth(r.latitude, r.longitude), ll_to_earth(:plat, :plng)) <= r.radius',
      )
      .setParameters({ plat: profile.latitude, plng: profile.longitude })
      .addSelect(
        'earth_distance(ll_to_earth(r.latitude, r.longitude), ll_to_earth(:plat, :plng))',
        'distance',
      )
      .orderBy('distance', 'ASC')
      .limit(100);

    const { entities, raw } = await qb.getRawAndEntities();
    const rows = raw as Array<{ distance?: string | number }>;
    const respondedIds = await this.respondedRequestIds(
      providerUserId,
      entities.map((e) => e.id),
    );
    return entities.map((r, i) =>
      this.presentForProvider(
        r,
        r.seeker ?? null,
        Number(rows[i]?.distance ?? 0),
        respondedIds.has(r.id),
      ),
    );
  }

  /** Which of the given requests this provider has already offered to help on. */
  private async respondedRequestIds(
    providerUserId: string,
    requestIds: string[],
  ): Promise<Set<string>> {
    if (!requestIds.length) return new Set();
    const rows = await this.responses.find({
      where: { providerId: providerUserId, requestId: In(requestIds) },
      select: { requestId: true },
    });
    return new Set(rows.map((r) => r.requestId));
  }

  /** Provider raises their hand. Notifies the seeker in realtime. */
  async respond(requestId: string, providerUserId: string) {
    const r = await this.requests.findOne({ where: { id: requestId } });
    if (!r) throw new NotFoundException('Request not found');
    if (r.status !== ServiceRequestStatus.OPEN || r.expiresAt <= new Date()) {
      throw new BadRequestException('This request is no longer open');
    }

    const existing = await this.responses.findOne({
      where: { requestId, providerId: providerUserId },
    });
    if (!existing) {
      await this.responses.save(
        this.responses.create({ requestId, providerId: providerUserId }),
      );
    }

    const provider = await this.users.findOne({
      where: { id: providerUserId },
    });
    this.gateway.emitToUser(r.seekerId, 'request:response', {
      requestId,
      provider: this.presentUser(provider ?? null),
    });
    return { ok: true };
  }

  /** Provider withdraws a previous "I can help" offer. Updates the seeker. */
  async withdraw(requestId: string, providerUserId: string) {
    await this.responses.delete({ requestId, providerId: providerUserId });
    const r = await this.requests.findOne({ where: { id: requestId } });
    if (r) {
      this.gateway.emitToUser(r.seekerId, 'request:response-removed', {
        requestId,
        providerId: providerUserId,
      });
    }
    return { ok: true };
  }

  /** Mark a request fulfilled (a provider was accepted) — clears offers and
   * drops the raised hand from every other matching provider's map. */
  async markFulfilled(requestId: string): Promise<void> {
    const r = await this.requests.findOne({ where: { id: requestId } });
    if (!r) return;
    r.status = ServiceRequestStatus.FULFILLED;
    await this.requests.save(r);
    await this.responses.delete({ requestId: r.id });
    const providerUserIds = await this.matchingProviderUserIds(
      r.skillId,
      r.latitude,
      r.longitude,
      r.radius,
    );
    this.gateway.emitToUsers(providerUserIds, 'request:removed', { id: r.id });
  }

  // ---- internals ----

  private async cancelOpenForSeeker(seekerId: string): Promise<void> {
    const open = await this.requests.find({
      where: { seekerId, status: ServiceRequestStatus.OPEN },
    });
    for (const r of open) await this.markRemoved(r);
  }

  /** Mark a request closed (cancelled/expired) and tell matching providers to
   * drop the marker (and close its dialog). */
  private async markRemoved(
    r: ServiceRequest,
    status: ServiceRequestStatus = ServiceRequestStatus.CANCELLED,
  ): Promise<void> {
    r.status = status;
    await this.requests.save(r);
    // The "I can help" offers are only meaningful while the request is open —
    // drop them once it's cancelled/expired.
    await this.responses.delete({ requestId: r.id });
    const providerUserIds = await this.matchingProviderUserIds(
      r.skillId,
      r.latitude,
      r.longitude,
      r.radius,
    );
    this.gateway.emitToUsers(providerUserIds, 'request:removed', { id: r.id });
  }

  private async matchingProviderUserIds(
    skillId: string,
    lat: number,
    lng: number,
    radius: number,
  ): Promise<string[]> {
    const rows = await this.profiles
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .select('p.userId', 'userId')
      .where('p.status = :status', { status: ProviderStatus.APPROVED })
      .andWhere('p."isAvailable" = true')
      .andWhere(`'provider' = ANY(u.roles)`)
      .andWhere('p.latitude IS NOT NULL AND p.longitude IS NOT NULL')
      .andWhere(
        `EXISTS (SELECT 1 FROM "provider_profile_skills" pps
                 WHERE pps."providerProfilesId" = p.id AND pps."skillsId" = :skillId)`,
      )
      .andWhere(
        'earth_box(ll_to_earth(:lat, :lng), :radius) @> ll_to_earth(p.latitude, p.longitude)',
      )
      .andWhere(
        'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(p.latitude, p.longitude)) <= :radius',
      )
      // Skip providers already locked into an active job.
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM "engagements" e
                     WHERE e."providerId" = p."userId" AND e.status = 'active')`,
      )
      .setParameters({ skillId, lat, lng, radius })
      .getRawMany<{ userId: string }>();
    return rows.map((r) => r.userId);
  }

  private presentUser(u: User | null) {
    return u
      ? { id: u.id, name: u.name, avatarUrl: u.avatarUrl ?? null }
      : null;
  }

  private presentSkill(s?: Skill | null) {
    return s ? { id: s.id, name: s.name, slug: s.slug } : null;
  }

  /** Payload a provider sees (a seeker's raised hand). */
  private presentForProvider(
    r: ServiceRequest,
    seeker: User | null,
    distanceMeters: number | null,
    hasResponded = false,
  ) {
    return {
      id: r.id,
      description: r.description,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      skill: this.presentSkill(r.skill),
      seeker: this.presentUser(seeker),
      distanceMeters:
        distanceMeters !== null ? Math.round(distanceMeters) : null,
      hasResponded,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }

  /** Payload the seeker sees about their own broadcast (+ responders). */
  private presentForSeeker(
    r: ServiceRequest,
    responses: ServiceRequestResponse[],
    distances: Map<string, number> = new Map(),
    photos: Map<string, string> = new Map(),
  ) {
    return {
      id: r.id,
      description: r.description,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      skill: this.presentSkill(r.skill),
      status: r.status,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      responders: responses.map((resp) => {
        const u = resp.provider ?? null;
        return {
          id: resp.id,
          // Verified uploaded selfie, never the Google avatar.
          provider: u
            ? { id: u.id, name: u.name, avatarUrl: photos.get(u.id) ?? null }
            : null,
          distanceMeters: distances.get(resp.providerId) ?? null,
          createdAt: resp.createdAt,
        };
      }),
    };
  }
}
