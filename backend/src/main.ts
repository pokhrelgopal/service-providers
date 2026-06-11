import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import type { Env } from './config/env.validation';

/**
 * Silences the harmless Express-5 "Unsupported route path" warning that
 * @nestjs/swagger triggers for its wildcard asset route (Nest auto-converts it).
 * The warning is emitted during `app.listen()` route mapping, so this is
 * installed before Swagger setup and the returned `restore` is called after
 * `listen()`. Guarded so it safely no-ops if the internal module path changes.
 */
function silenceLegacyRouteWarnings(): () => void {
  type Converter = { printWarning?: (route: string) => void };
  let converter: Converter | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@nestjs/core/router/legacy-route-converter') as {
      LegacyRouteConverter?: Converter;
    };
    converter = mod.LegacyRouteConverter;
  } catch {
    converter = undefined;
  }
  if (!converter) return () => {};
  const original = converter.printWarning;
  converter.printWarning = () => {};
  return () => {
    converter.printWarning = original;
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use pino as the app logger (structured logs with request ids).
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });

  app.use(helmet());
  app.use(cookieParser());
  // Dev: reflect any origin (LAN IPs, mobile, etc.) — a literal "*" is invalid
  // with credentialed (cookie) requests, so we echo the caller's origin instead.
  // Prod: restrict to the configured web origin.
  const isProd = config.get('NODE_ENV', { infer: true }) === 'production';
  app.enableCors({ origin: isProd ? [webOrigin] : true, credentials: true });

  // Redis-backed Socket.IO adapter → events fan out across API instances.
  const redisAdapter = new RedisIoAdapter(
    app,
    config.get('REDIS_URL', { infer: true }),
  );
  await redisAdapter.connect();
  app.useWebSocketAdapter(redisAdapter);

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'metrics'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableShutdownHooks();

  // OpenAPI / Swagger at /api/v1/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Servio API')
    .setDescription('Service-provider marketplace API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Swagger's wildcard asset route is auto-converted by Express 5 with a noisy
  // (harmless) warning emitted during route mapping at listen() — silence it.
  const restoreRouteWarnings = silenceLegacyRouteWarnings();
  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  restoreRouteWarnings();
  app
    .get(Logger)
    .log(
      `API listening on http://localhost:${port} (docs: /api/v1/docs)`,
      'Bootstrap',
    );
}

void bootstrap();
