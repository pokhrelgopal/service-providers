import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { createTransport, type Transporter } from 'nodemailer';
import {
  EMAIL_QUEUE,
  EmailJob,
  type AccountVerifiedData,
} from './mail.constants';
import { accountVerifiedEmail } from './templates';
import type { Env } from '../config/env.validation';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
    const host = this.config.get('SMTP_HOST', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    this.from =
      this.config.get('MAIL_FROM', { infer: true }) ??
      user ??
      'no-reply@servio.local';

    this.transporter = host
      ? createTransport({
          host,
          port: this.config.get('SMTP_PORT', { infer: true }),
          secure: this.config.get('SMTP_SECURE', { infer: true }),
          auth: user
            ? { user, pass: this.config.get('SMTP_PASS', { infer: true }) }
            : undefined,
        })
      : null;
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EmailJob.ACCOUNT_VERIFIED:
        await this.sendAccountVerified(job.data as AccountVerifiedData);
        return;
      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }

  private async sendAccountVerified(data: AccountVerifiedData): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — skipping account-verified email to ${data.to}`,
      );
      return;
    }
    const { subject, html, text } = accountVerifiedEmail(data.name);
    await this.transporter.sendMail({
      from: this.from,
      to: data.to,
      subject,
      html,
      text,
    });
    this.logger.log(`Sent account-verified email to ${data.to}`);
  }
}
