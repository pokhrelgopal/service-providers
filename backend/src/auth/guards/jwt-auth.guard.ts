import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes with a valid access-token Bearer. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
