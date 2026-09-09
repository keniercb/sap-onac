import type { UUID, ISODateString } from './common';

export interface AuthUser {
  id: UUID;
  username: string;
  fullName: string;
  email: string | null;
  roles: string[];
  territories: UserTerritory[];
  twoFactorEnabled: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: ISODateString | null;
}

export interface UserTerritory {
  roleId: number;
  roleCode: string;
  provinceId: number | null;
  municipalityId: number | null;
}

export interface LoginRequest {
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}
