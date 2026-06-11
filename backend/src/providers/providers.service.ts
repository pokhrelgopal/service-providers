import { randomInt, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { StorageService } from '../storage/storage.service';
import { SkillsService } from '../skills/skills.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { ProviderProfile } from './provider-profile.entity';
import { Document } from './document.entity';
import { ProviderStatus } from './provider-status.enum';
import { DocumentType } from './document-type.enum';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ConfirmDocumentDto } from './dto/confirm-document.dto';
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
} from './dto/presign-document.dto';

const OTP_TTL_SECONDS = 15 * 60; // OTP valid for 15 minutes
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Public-facing provider card for discovery. Uses the public Google avatar —
 * never the private selfie/ID documents. */
function presentProviderCard(
  profile: ProviderProfile,
  distanceMeters: number | null,
) {
  return {
    id: profile.id,
    name: profile.user?.name ?? null,
    avatarUrl: profile.user?.avatarUrl ?? null,
    serviceDescription: profile.serviceDescription,
    latitude: profile.latitude,
    longitude: profile.longitude,
    skills: (profile.skills ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    })),
    distanceMeters: distanceMeters !== null ? Math.round(distanceMeters) : null,
    rating:
      profile.ratingCount > 0
        ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
        : null,
    reviewCount: profile.ratingCount,
  };
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    @InjectRepository(ProviderProfile)
    private readonly profiles: Repository<ProviderProfile>,
    @InjectRepository(Document)
    private readonly documents: Repository<Document>,
    private readonly skills: SkillsService,
    private readonly storage: StorageService,
    private readonly users: UsersService,
    private readonly mail: MailService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Get the caller's provider profile (creating a draft on first access). */
  async getOrCreateDraft(userId: string): Promise<ProviderProfile> {
    const existing = await this.profiles.findOne({
      where: { userId },
      relations: { skills: true, documents: true },
    });
    if (existing) return existing;

    const created = this.profiles.create({
      userId,
      status: ProviderStatus.DRAFT,
    });
    await this.profiles.save(created);
    return this.profiles.findOneOrFail({
      where: { userId },
      relations: { skills: true, documents: true },
    });
  }

  async updateApplication(
    userId: string,
    dto: UpdateApplicationDto,
  ): Promise<ProviderProfile> {
    const profile = await this.getOrCreateDraft(userId);
    this.assertEditable(profile);

    if (dto.legalName !== undefined) profile.legalName = dto.legalName;
    if (dto.serviceDescription !== undefined)
      profile.serviceDescription = dto.serviceDescription;
    if (
      dto.phoneNumber !== undefined &&
      dto.phoneNumber !== profile.phoneNumber
    ) {
      profile.phoneNumber = dto.phoneNumber;
      profile.phoneVerified = false; // re-verify on change
    }
    if (dto.skillIds) {
      profile.skills = await this.skills.findByIds(dto.skillIds);
    }
    await this.profiles.save(profile);
    return this.getOrCreateDraft(userId);
  }

  /** Generate + store a phone OTP. No SMS yet — the code is logged. */
  async sendPhoneOtp(userId: string): Promise<void> {
    const profile = await this.getOrCreateDraft(userId);
    if (!profile.phoneNumber) {
      throw new BadRequestException('Add a phone number first');
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.redis.set(`otp:phone:${userId}`, code, 'EX', OTP_TTL_SECONDS);
    // TODO(M-later): send via SMS provider. For now, log it.
    this.logger.log(
      `📲 Phone OTP for user ${userId} (${profile.phoneDialCode}${profile.phoneNumber}): ${code}`,
    );
    console.log(
      `[DEV] Phone OTP for ${profile.phoneDialCode}${profile.phoneNumber}: ${code}`,
    );
  }

  async verifyPhoneOtp(userId: string, code: string): Promise<ProviderProfile> {
    const stored = await this.redis.get(`otp:phone:${userId}`);
    if (!stored || stored !== code) {
      throw new BadRequestException('Invalid or expired code');
    }
    await this.redis.del(`otp:phone:${userId}`);
    const profile = await this.getOrCreateDraft(userId);
    profile.phoneVerified = true;
    await this.profiles.save(profile);
    return this.getOrCreateDraft(userId);
  }

  /** Validate the upload and return a presigned PUT URL + object key. */
  async presignDocument(
    userId: string,
    type: DocumentType,
    mimeType: string,
  ): Promise<{ uploadUrl: string; objectKey: string }> {
    if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`,
      );
    }
    const ext = EXT_BY_MIME[mimeType];
    const objectKey = `providers/${userId}/${type}-${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.presignedPut(objectKey);
    return { uploadUrl, objectKey };
  }

  /** Record an uploaded document, replacing any previous one of the same type. */
  async confirmDocument(
    userId: string,
    dto: ConfirmDocumentDto,
  ): Promise<Document> {
    if (dto.sizeBytes > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File too large');
    }
    if (!dto.objectKey.startsWith(`providers/${userId}/`)) {
      throw new BadRequestException('Invalid object key');
    }
    if (!(await this.storage.objectExists(dto.objectKey))) {
      throw new BadRequestException('Upload not found — did the PUT succeed?');
    }

    const profile = await this.getOrCreateDraft(userId);
    this.assertEditable(profile);

    // Replace any existing document of the same type.
    const previous = await this.documents.find({
      where: { providerProfileId: profile.id, type: dto.type },
    });
    for (const doc of previous) {
      await this.storage.remove(doc.objectKey);
      if (doc.thumbnailKey) await this.storage.remove(doc.thumbnailKey);
      await this.documents.delete(doc.id);
    }

    const thumbnailKey = await this.storage.generateThumbnail(dto.objectKey);
    const doc = this.documents.create({
      providerProfileId: profile.id,
      type: dto.type,
      objectKey: dto.objectKey,
      thumbnailKey,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    });
    return this.documents.save(doc);
  }

  /** Submit the application: validate completeness, lock it, grant provider role. */
  async submit(userId: string): Promise<ProviderProfile> {
    const profile = await this.getOrCreateDraft(userId);
    this.assertEditable(profile);

    const missing: string[] = [];
    if (!profile.legalName) missing.push('legal name');
    if (!profile.phoneVerified) missing.push('verified phone number');
    if (!profile.skills || profile.skills.length === 0)
      missing.push('at least one skill');
    const types = new Set(profile.documents?.map((d) => d.type));
    if (!types.has(DocumentType.SELFIE)) missing.push('a selfie photo');
    if (!types.has(DocumentType.ID_DOCUMENT)) missing.push('an ID document');
    if (missing.length) {
      throw new BadRequestException(`Please provide: ${missing.join(', ')}`);
    }

    profile.status = ProviderStatus.SUBMITTED;
    profile.submittedAt = new Date();
    profile.rejectionReason = null;
    await this.profiles.save(profile);

    // Becoming a provider grants the role (now "onboarded") and drops any
    // seeker role — a user can't be both. Admin approval (M5) makes them
    // publicly discoverable.
    await this.users.promoteToProvider(userId);

    return this.getOrCreateDraft(userId);
  }

  /* ----------------------------- Admin review ----------------------------- */

  /** Submitted applications awaiting review, with user + skills + documents. */
  listSubmitted(): Promise<ProviderProfile[]> {
    return this.profiles.find({
      where: { status: ProviderStatus.SUBMITTED },
      relations: { user: true, skills: true, documents: true },
      order: { submittedAt: 'ASC' },
    });
  }

  /** Approve a submitted application and email the provider. */
  async approve(profileId: string): Promise<ProviderProfile> {
    const profile = await this.profiles.findOne({
      where: { id: profileId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Application not found');
    if (profile.status !== ProviderStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted applications can be approved',
      );
    }
    profile.status = ProviderStatus.APPROVED;
    profile.reviewedAt = new Date();
    profile.rejectionReason = null;
    await this.profiles.save(profile);

    if (profile.user) {
      await this.mail.queueAccountVerified({
        to: profile.user.email,
        name: profile.user.name,
      });
    }
    return profile;
  }

  /** Reject a submitted application with a reason. */
  async reject(profileId: string, reason: string): Promise<ProviderProfile> {
    const profile = await this.profiles.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Application not found');
    if (profile.status !== ProviderStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted applications can be rejected',
      );
    }
    profile.status = ProviderStatus.REJECTED;
    profile.rejectionReason = reason;
    profile.reviewedAt = new Date();
    await this.profiles.save(profile);
    return profile;
  }

  /** Shape a profile (with its user) + presigned document URLs for the admin UI. */
  async presentForAdmin(profile: ProviderProfile) {
    const documents = await Promise.all(
      (profile.documents ?? []).map(async (d) => ({
        id: d.id,
        type: d.type,
        url: await this.storage.presignedGet(d.objectKey),
        thumbnailUrl: d.thumbnailKey
          ? await this.storage.presignedGet(d.thumbnailKey)
          : null,
      })),
    );
    return {
      id: profile.id,
      status: profile.status,
      legalName: profile.legalName,
      phoneDialCode: profile.phoneDialCode,
      phoneNumber: profile.phoneNumber,
      phoneVerified: profile.phoneVerified,
      serviceDescription: profile.serviceDescription,
      submittedAt: profile.submittedAt,
      skills: (profile.skills ?? []).map((s) => ({ id: s.id, name: s.name })),
      documents,
      user: profile.user
        ? {
            id: profile.user.id,
            name: profile.user.name,
            email: profile.user.email,
            avatarUrl: profile.user.avatarUrl,
          }
        : null,
    };
  }

  /** Status used to enrich /auth/me. Null when the user isn't a provider. */
  async getStatus(userId: string): Promise<ProviderStatus | null> {
    const profile = await this.profiles.findOne({
      where: { userId },
      select: { status: true },
    });
    return profile?.status ?? null;
  }

  /** Profile + documents with short-lived presigned view URLs. */
  async getApplicationView(userId: string) {
    const profile = await this.getOrCreateDraft(userId);
    const documents = await Promise.all(
      (profile.documents ?? []).map(async (d) => ({
        id: d.id,
        type: d.type,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        url: await this.storage.presignedGet(d.objectKey),
        thumbnailUrl: d.thumbnailKey
          ? await this.storage.presignedGet(d.thumbnailKey)
          : null,
        createdAt: d.createdAt,
      })),
    );
    return {
      id: profile.id,
      status: profile.status,
      legalName: profile.legalName,
      phoneCountry: profile.phoneCountry,
      phoneDialCode: profile.phoneDialCode,
      phoneNumber: profile.phoneNumber,
      phoneVerified: profile.phoneVerified,
      serviceDescription: profile.serviceDescription,
      rejectionReason: profile.rejectionReason,
      submittedAt: profile.submittedAt,
      latitude: profile.latitude,
      longitude: profile.longitude,
      isAvailable: profile.isAvailable,
      skills: (profile.skills ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
      })),
      documents,
    };
  }

  /* -------------------------- Location & availability -------------------------- */

  /** Set the provider's exact discovery location (from device GPS). */
  async setLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<ProviderProfile> {
    const profile = await this.getOrCreateDraft(userId);
    profile.latitude = latitude;
    profile.longitude = longitude;
    await this.profiles.save(profile);
    return this.getOrCreateDraft(userId);
  }

  /** Toggle whether the provider appears on the map. */
  async setAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<ProviderProfile> {
    const profile = await this.getOrCreateDraft(userId);
    profile.isAvailable = isAvailable;
    await this.profiles.save(profile);
    return this.getOrCreateDraft(userId);
  }

  /* ------------------------------- Discovery -------------------------------- */

  /**
   * Approved, available, located providers within `radius` metres of (lat,lng),
   * sorted by distance. earth_box is the index-backed bounding-box prefilter;
   * earth_distance refines + sorts.
   */
  async findNearby(
    lat: number,
    lng: number,
    radius: number,
    skill?: string,
  ): Promise<Array<ReturnType<typeof presentProviderCard>>> {
    const qb = this.profiles
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.skills', 's')
      .where('p.status = :status', { status: ProviderStatus.APPROVED })
      .andWhere('p.isAvailable = true')
      .andWhere(`'provider' = ANY(u.roles)`)
      .andWhere('p.latitude IS NOT NULL AND p.longitude IS NOT NULL')
      .andWhere(
        'earth_box(ll_to_earth(:lat, :lng), :radius) @> ll_to_earth(p.latitude, p.longitude)',
      )
      .andWhere(
        'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(p.latitude, p.longitude)) <= :radius',
      )
      .setParameters({ lat, lng, radius })
      .addSelect(
        'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(p.latitude, p.longitude))',
        'distance',
      )
      .orderBy('distance', 'ASC')
      .limit(100);

    if (skill) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM "provider_profile_skills" pps
                 JOIN "skills" sk ON sk."id" = pps."skillsId"
                 WHERE pps."providerProfilesId" = p."id" AND sk."slug" = :skill)`,
        { skill },
      );
    }

    const { entities, raw } = await qb.getRawAndEntities();
    const rows = raw as Array<{ distance?: string | number }>;
    return entities.map((profile, i) =>
      presentProviderCard(profile, Number(rows[i]?.distance ?? 0)),
    );
  }

  /** Public provider detail (approved providers only). Shows the provider's own
   * uploaded selfie (presigned) rather than the Google avatar. */
  async getPublicProfile(id: string) {
    const profile = await this.profiles.findOne({
      where: { id, status: ProviderStatus.APPROVED },
      relations: { user: true, skills: true, documents: true },
    });
    if (!profile || !profile.user?.roles?.includes(UserRole.PROVIDER)) {
      throw new NotFoundException('Provider not found');
    }
    const card = presentProviderCard(profile, null);
    const selfie = (profile.documents ?? []).find(
      (d) => d.type === DocumentType.SELFIE,
    );
    if (selfie) {
      card.avatarUrl = await this.storage.presignedGet(selfie.objectKey);
    }
    return card;
  }

  /** Map of userId → presigned uploaded-selfie URL for the given providers.
   * Used wherever a provider's verified photo should replace the Google avatar. */
  async getSelfieUrlsByUserIds(
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (!userIds.length) return new Map();
    const profiles = await this.profiles.find({
      where: { userId: In(userIds) },
      relations: { documents: true },
    });
    const out = new Map<string, string>();
    for (const p of profiles) {
      const selfie = (p.documents ?? []).find(
        (d) => d.type === DocumentType.SELFIE,
      );
      if (selfie) {
        out.set(p.userId, await this.storage.presignedGet(selfie.objectKey));
      }
    }
    return out;
  }

  private assertEditable(profile: ProviderProfile): void {
    if (
      profile.status === ProviderStatus.SUBMITTED ||
      profile.status === ProviderStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Application is ${profile.status} and can no longer be edited`,
      );
    }
  }
}
