import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { SkillsModule } from '../skills/skills.module';
import { MailModule } from '../mail/mail.module';
import { ProviderProfile } from './provider-profile.entity';
import { Document } from './document.entity';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderProfile, Document]),
    UsersModule,
    SkillsModule,
    MailModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
