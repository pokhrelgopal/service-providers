import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { AdminProvidersController } from './admin-providers.controller';

@Module({
  imports: [ProvidersModule],
  controllers: [AdminProvidersController],
})
export class AdminModule {}
