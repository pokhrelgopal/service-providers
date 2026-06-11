import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { CallsService } from './calls.service';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  /** ICE servers (STUN + short-lived TURN creds) for the caller's browser. */
  @Get('ice-servers')
  iceServers(@CurrentUser() user: AuthUser) {
    return this.calls.getIceServers(user.id);
  }
}
