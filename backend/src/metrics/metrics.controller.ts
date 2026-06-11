import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { collectDefaultMetrics, register, type Registry } from 'prom-client';

// Default process/Node metrics, collected once per process.
let started = false;
function ensureStarted(): void {
  if (!started) {
    collectDefaultMetrics();
    started = true;
  }
}

@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  private readonly registry: Registry = register;

  constructor() {
    ensureStarted();
  }

  /** Prometheus scrape endpoint (unprefixed: /metrics). */
  @Get()
  @Header('Content-Type', register.contentType)
  async metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
