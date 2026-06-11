import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Engagement } from '../engagements/engagement.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Engagement])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
