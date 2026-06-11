import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { EngagementsService } from './engagements.service';
import { AcceptDto } from './dto/accept.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { PresignImageDto } from './dto/presign-image.dto';

@ApiTags('engagements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('engagements')
export class EngagementsController {
  constructor(private readonly engagements: EngagementsService) {}

  /** Seeker accepts a provider who offered to help. */
  @Post()
  accept(@CurrentUser() user: AuthUser, @Body() dto: AcceptDto) {
    return this.engagements.accept(user.id, dto);
  }

  /** The current user's active engagement (drives the chat bubble). */
  @Get('active')
  active(@CurrentUser() user: AuthUser) {
    return this.engagements.active(user.id);
  }

  /** The seeker's completed jobs, newest first (Request History page). */
  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.engagements.history(user.id);
  }

  /** The provider's completed jobs, newest first, cursor-paginated. */
  @Get('completed-jobs')
  completedJobs(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.engagements.completedJobs(
      user.id,
      query.limit ?? 20,
      query.cursor,
    );
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagements.listMessages(id, user.id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.engagements.send(id, user.id, dto);
  }

  /** Presign a PUT URL to upload a chat image. */
  @Post(':id/image')
  presignImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PresignImageDto,
  ) {
    return this.engagements.presignImage(id, user.id, dto);
  }

  /** Mark the conversation read (clears the unread badge). */
  @Post(':id/read')
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.engagements.markRead(id, user.id);
  }

  /** Seeker marks the job complete. */
  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagements.complete(id, user.id);
  }
}
