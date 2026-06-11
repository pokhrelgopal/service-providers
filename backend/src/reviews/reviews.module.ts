import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProviderProfile } from '../providers/provider-profile.entity';
import { ProvidersModule } from '../providers/providers.module';
import { Engagement } from '../engagements/engagement.entity';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Engagement, ProviderProfile]),
    ProvidersModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
