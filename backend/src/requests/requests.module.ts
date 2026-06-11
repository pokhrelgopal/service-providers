import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { Skill } from '../skills/skill.entity';
import { ProviderProfile } from '../providers/provider-profile.entity';
import { ProvidersModule } from '../providers/providers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Engagement } from '../engagements/engagement.entity';
import { ServiceRequest } from './service-request.entity';
import { ServiceRequestResponse } from './service-request-response.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      ServiceRequestResponse,
      ProviderProfile,
      Skill,
      User,
      Engagement,
    ]),
    ProvidersModule,
    RealtimeModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
