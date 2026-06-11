import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

export interface ResponseEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Wraps successful responses in a consistent envelope. /health (Terminus) and
 * /metrics (Prometheus exposition text) are left untouched so their canonical
 * output shapes are preserved.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T> | T> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.url.startsWith('/health') || req.url.startsWith('/metrics')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: (data ?? null) as T,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
