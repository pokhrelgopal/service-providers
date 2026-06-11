import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProvidersModule } from '../providers/providers.module';
import { RequestsModule } from '../requests/requests.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ServiceRequest } from '../requests/service-request.entity';
import { ServiceRequestResponse } from '../requests/service-request-response.entity';
import { Review } from '../reviews/review.entity';
import { Engagement } from './engagement.entity';
import { Message } from './message.entity';
import { EngagementsService } from './engagements.service';
import { EngagementsController } from './engagements.controller';
import { EngagementsGateway } from './engagements.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Engagement,
      Message,
      ServiceRequest,
      ServiceRequestResponse,
      Review,
    ]),
    ProvidersModule,
    RequestsModule,
    RealtimeModule,
  ],
  controllers: [EngagementsController],
  providers: [EngagementsService, EngagementsGateway],
})
export class EngagementsModule {}
