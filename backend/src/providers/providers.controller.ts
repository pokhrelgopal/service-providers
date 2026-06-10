import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.interface';
import { ProvidersService } from './providers.service';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { PresignDocumentDto } from './dto/presign-document.dto';
import { ConfirmDocumentDto } from './dto/confirm-document.dto';

@ApiTags('provider')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('provider')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  /** Current user's provider application (creates a draft on first call). */
  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.providers.getApplicationView(user.id);
  }

  @Patch('application')
  async updateApplication(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateApplicationDto,
  ) {
    await this.providers.updateApplication(user.id, dto);
    return this.providers.getApplicationView(user.id);
  }

  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@CurrentUser() user: AuthUser) {
    await this.providers.sendPhoneOtp(user.id);
    return { sent: true };
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@CurrentUser() user: AuthUser, @Body() dto: VerifyOtpDto) {
    await this.providers.verifyPhoneOtp(user.id, dto.code);
    return { verified: true };
  }

  /** Get a presigned PUT URL to upload a document/selfie directly to storage. */
  @Post('documents/presign')
  @HttpCode(HttpStatus.OK)
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDocumentDto) {
    return this.providers.presignDocument(user.id, dto.type, dto.mimeType);
  }

  /** Record a successfully uploaded document (generates a thumbnail). */
  @Post('documents/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmDocumentDto,
  ) {
    await this.providers.confirmDocument(user.id, dto);
    return this.providers.getApplicationView(user.id);
  }

  @Post('application/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@CurrentUser() user: AuthUser) {
    await this.providers.submit(user.id);
    return this.providers.getApplicationView(user.id);
  }
}
