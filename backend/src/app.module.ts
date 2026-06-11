import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SkillsModule } from './skills/skills.module';
import { ProvidersModule } from './providers/providers.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AdminModule } from './admin/admin.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { RequestsModule } from './requests/requests.module';
import { EngagementsModule } from './engagements/engagements.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MailModule } from './mail/mail.module';
import type { Env } from './config/env.validation';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        // Attach/propagate a request id on every request.
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const existing = req.headers['x-request-id'];
          const id =
            (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport: isProd
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.get('REDIS_URL', { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
          },
        };
      },
    }),
    DatabaseModule,
    RedisModule,
    StorageModule,
    HealthModule,
    UsersModule,
    AuthModule,
    SkillsModule,
    ProvidersModule,
    OnboardingModule,
    AdminModule,
    DiscoveryModule,
    RealtimeModule,
    RequestsModule,
    EngagementsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
