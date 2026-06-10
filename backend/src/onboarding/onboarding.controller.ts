import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';

@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly users: UsersService) {}

  /** Seeker path: one click — grants the seeker role (marks onboarding done).
   * Rejected for existing providers (seeker/provider are mutually exclusive). */
  @Post('seeker')
  @HttpCode(HttpStatus.OK)
  async chooseSeeker(@CurrentUser() user: AuthUser) {
    await this.users.assignSeekerRole(user.id);
    return { role: UserRole.SEEKER };
  }
}
