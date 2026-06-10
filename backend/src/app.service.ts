import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** Lightweight service descriptor; real /health lands in Milestone 1. */
  getInfo(): { name: string; status: string; version: string } {
    return {
      name: 'services-marketplace-api',
      status: 'ok',
      version: '0.0.1',
    };
  }
}
