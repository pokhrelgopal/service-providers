import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectOfferDto } from './dto/reject-offer.dto';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  /** Seeker broadcasts a service need. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRequestDto) {
    return this.requests.create(user.id, dto);
  }

  /** Seeker's current open broadcast (+ responders). */
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.requests.mine(user.id);
  }

  /** Provider: open requests they can serve, near them. */
  @Get('incoming')
  incoming(@CurrentUser() user: AuthUser) {
    return this.requests.incoming(user.id);
  }

  /** Provider raises their hand on a request. */
  @Post(':id/respond')
  respond(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requests.respond(id, user.id);
  }

  /** Provider withdraws their offer to help. */
  @Delete(':id/respond')
  withdraw(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requests.withdraw(id, user.id);
  }

  /** Seeker rejects a provider's offer on this request. */
  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOfferDto,
  ) {
    return this.requests.reject(id, user.id, dto.providerId);
  }

  /** Seeker cancels their broadcast. */
  @Delete(':id')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requests.cancel(id, user.id);
  }
}
