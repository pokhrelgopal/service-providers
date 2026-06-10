import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from './mail.constants';
import { MailService } from './mail.service';
import { EmailProcessor } from './mail.processor';

@Module({
  imports: [BullModule.registerQueue({ name: EMAIL_QUEUE })],
  providers: [MailService, EmailProcessor],
  exports: [MailService],
})
export class MailModule {}
