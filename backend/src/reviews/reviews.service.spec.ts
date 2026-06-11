import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { EngagementStatus } from '../engagements/engagement-status.enum';

function setup(engagement: any, reviewExists = false, profile: any = null) {
  const reviews = {
    findOne: jest
      .fn()
      .mockResolvedValue(reviewExists ? { id: 'existing' } : null),
    create: jest.fn((x: Record<string, unknown>) => x),
    save: jest.fn((x: Record<string, unknown>) =>
      Promise.resolve({ id: 'rev1', ...x }),
    ),
  };
  const engagements = { findOne: jest.fn().mockResolvedValue(engagement) };
  const profiles = {
    findOne: jest.fn().mockResolvedValue(profile),
    save: jest.fn((x: unknown) => Promise.resolve(x)),
  };
  const providers = { getSelfieUrlsByUserIds: jest.fn() };
  const service = new ReviewsService(
    reviews as any,
    engagements as any,
    profiles as any,
    providers as any,
  );
  return { service, reviews, profiles };
}

const completedEngagement = {
  id: 'e1',
  seekerId: 'seeker1',
  providerId: 'provider1',
  status: EngagementStatus.COMPLETED,
};

describe('ReviewsService.create', () => {
  it('rejects a reviewer who is not the engagement seeker', async () => {
    const { service } = setup(completedEngagement);
    await expect(
      service.create('someone-else', { engagementId: 'e1', rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects reviewing a job that is not completed', async () => {
    const { service } = setup({
      ...completedEngagement,
      status: EngagementStatus.ACTIVE,
    });
    await expect(
      service.create('seeker1', { engagementId: 'e1', rating: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a second review for the same engagement', async () => {
    const { service } = setup(completedEngagement, true);
    await expect(
      service.create('seeker1', { engagementId: 'e1', rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bumps the provider rating aggregate on success', async () => {
    const profile = { ratingCount: 2, ratingSum: 8 };
    const { service, profiles } = setup(completedEngagement, false, profile);

    const result = await service.create('seeker1', {
      engagementId: 'e1',
      rating: 5,
    });

    expect(result).toEqual({ id: 'rev1' });
    expect(profile.ratingCount).toBe(3);
    expect(profile.ratingSum).toBe(13);
    expect(profiles.save).toHaveBeenCalledWith(profile);
  });
});
