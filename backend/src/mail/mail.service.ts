import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  EMAIL_QUEUE,
  EmailJob,
  type AccountVerifiedData,
} from './mail.constants';

@Injectable()
export class MailService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly queue: Queue) {}

  /** Enqueue the "your provider account is verified" email (sent off-request). */
  async queueAccountVerified(data: AccountVerifiedData): Promise<void> {
    await this.queue.add(EmailJob.ACCOUNT_VERIFIED, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
