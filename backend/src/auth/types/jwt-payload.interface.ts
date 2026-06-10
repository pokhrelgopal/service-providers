import { UserRole } from '../../users/user-role.enum';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  roles: UserRole[];
}

export interface RefreshTokenPayload {
  sub: string; // user id
  sid: string; // session id (one per device/login)
}

/** Shape attached to `req.user` by the JWT strategy. */
export interface AuthUser {
  id: string;
  email: string;
  roles: UserRole[];
}
