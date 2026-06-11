import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Engagement } from '../engagements/engagement.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallsGateway } from './calls.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Engagement]), RealtimeModule],
  controllers: [CallsController],
  providers: [CallsService, CallsGateway],
})
export class CallsModule {}
