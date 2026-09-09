import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  roles: string[];
  territories: Array<{
    roleCode: string;
    provinceId: bigint | null;
    municipalityId: bigint | null;
  }>;
  twoFactorEnabled: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | unknown => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!request.user) {
      return undefined;
    }
    return data ? request.user[data] : request.user;
  },
);
