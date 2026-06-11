import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';

/** App-wide realtime layer. Exports the gateway for other modules to emit. */
@Module({
  imports: [JwtModule.register({})],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class RealtimeModule {}
