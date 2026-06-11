import { of, lastValueFrom } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

function ctx(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ url }) }),
  } as unknown as ExecutionContext;
}
function handler<T>(value: T): CallHandler<T> {
  return { handle: () => of(value) };
}

describe('ResponseEnvelopeInterceptor', () => {
  const interceptor = new ResponseEnvelopeInterceptor();

  it('wraps normal responses in the envelope', async () => {
    const out = await lastValueFrom(
      interceptor.intercept(ctx('/api/v1/skills'), handler([1, 2])),
    );
    expect(out).toMatchObject({ success: true, data: [1, 2] });
  });

  it('passes /metrics through untouched (raw Prometheus text)', async () => {
    const out = await lastValueFrom(
      interceptor.intercept(ctx('/metrics'), handler('# HELP raw')),
    );
    expect(out).toBe('# HELP raw');
  });

  it('passes /health through untouched', async () => {
    const out = await lastValueFrom(
      interceptor.intercept(ctx('/health'), handler({ status: 'ok' })),
    );
    expect(out).toEqual({ status: 'ok' });
  });
});
