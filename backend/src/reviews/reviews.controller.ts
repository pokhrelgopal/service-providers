import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Seeker leaves a review for a completed engagement. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  /** A completed job this seeker hasn't reviewed yet (drives the prompt). */
  @Get('pending')
  pending(@CurrentUser() user: AuthUser) {
    return this.reviews.pending(user.id);
  }

  /** Reviews received by the current provider, cursor-paginated. */
  @Get('received')
  received(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.reviews.received(user.id, query.limit ?? 20, query.cursor);
  }
}
