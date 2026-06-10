import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { REFRESH_COOKIE } from './auth.constants';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/jwt-payload.interface';
import { UsersService, type GoogleProfile } from '../users/users.service';
import { User } from '../users/user.entity';
import { ProvidersService } from '../providers/providers.service';
import type { ProviderStatus } from '../providers/provider-status.enum';
import type { Env } from '../config/env.validation';

function presentUser(user: User, providerStatus: ProviderStatus | null) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    /** Verification status of the provider application, or null if not a provider. */
    providerStatus,
    createdAt: user.createdAt,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly providers: ProvidersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge:
        this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) *
        86_400 *
        1000,
    };
  }

  private meta(req: Request) {
    return { userAgent: req.headers['user-agent'], ip: req.ip };
  }

  /** Step 1: kick off Google OAuth (redirects to Google). */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Guard handles the redirect.
  }

  /** Step 2: Google redirects back here; issue a session and bounce to the web app. */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfile;
    const user = await this.auth.loginWithGoogle(profile);
    const { refreshToken } = await this.auth.issueSession(user, this.meta(req));

    res.cookie(REFRESH_COOKIE, refreshToken, this.refreshCookieOptions());
    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    res.redirect(`${webOrigin}/auth/callback`);
  }

  /** Email + password login (admin accounts). Mirrors the refresh response. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.loginWithPassword(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.auth.issueSession(
      user,
      this.meta(req),
    );
    res.cookie(REFRESH_COOKIE, refreshToken, this.refreshCookieOptions());
    const providerStatus = await this.providers.getStatus(user.id);
    return { accessToken, user: presentUser(user, providerStatus) };
  }

  /** Exchange the refresh cookie for a fresh access token (and rotate refresh). */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('No refresh token');

    const { accessToken, refreshToken, user } = await this.auth.rotate(
      token,
      this.meta(req),
    );
    res.cookie(REFRESH_COOKIE, refreshToken, this.refreshCookieOptions());
    const providerStatus = await this.providers.getStatus(user.id);
    return { accessToken, user: presentUser(user, providerStatus) };
  }

  /** Log out the current device/session. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await this.auth.revokeFromToken(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true };
  }

  /** Log out of every device. */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.revokeAll(user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true };
  }

  /** Current authenticated user. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() authUser: AuthUser) {
    const user = await this.users.findById(authUser.id);
    if (!user) throw new UnauthorizedException();
    const providerStatus = await this.providers.getStatus(authUser.id);
    return presentUser(user, providerStatus);
  }
}
