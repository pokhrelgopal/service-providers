import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { DiscoveryController } from './discovery.controller';

@Module({
  imports: [ProvidersModule],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
