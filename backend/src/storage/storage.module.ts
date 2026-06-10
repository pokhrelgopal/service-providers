import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { MINIO_CLIENT } from './storage.constants';
import { StorageService } from './storage.service';
import type { Env } from '../config/env.validation';

@Global()
@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new Client({
          endPoint: config.get('MINIO_ENDPOINT', { infer: true }),
          port: config.get('MINIO_PORT', { infer: true }),
          useSSL: config.get('MINIO_USE_SSL', { infer: true }),
          accessKey: config.get('MINIO_ACCESS_KEY', { infer: true }),
          secretKey: config.get('MINIO_SECRET_KEY', { infer: true }),
        }),
    },
    StorageService,
  ],
  exports: [MINIO_CLIENT, StorageService],
})
export class StorageModule {}
