import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [UsersModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
