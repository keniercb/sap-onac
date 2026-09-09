import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';

import { UsersService } from '@modules/users/users.service';
import { RedisService } from '@common/redis/redis.service';
import type { AuthenticatedUser } from '@common/decorators/current-user.decorator';
import type { LoginDto, RefreshTokenDto, ChangePasswordDto, Verify2FADto } from './dto';

interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthenticatedUser;
  }> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const lockKey = `lockout:${dto.username}`;
    const attempts = Number(await this.redis.get(lockKey)) || 0;
    const maxAttempts = this.config.get<number>('LOCKOUT_MAX_ATTEMPTS', 5);
    if (attempts >= maxAttempts) {
      throw new UnauthorizedException('Cuenta temporalmente bloqueada');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.redis.incr(lockKey);
      await this.redis.expire(
        lockKey,
        this.config.get<number>('LOCKOUT_DURATION_MINUTES', 15) * 60,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.twoFactorEnabled && !dto.twoFactorCode) {
      throw new UnauthorizedException('Se requiere código 2FA');
    }
    if (user.twoFactorEnabled && dto.twoFactorCode && user.twoFactorSecret) {
      const valid2FA = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret,
      });
      if (!valid2FA) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    await this.redis.del(lockKey);
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');
    const stored = await this.redis.get(`refresh:${refreshTokenHash}`);
    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    const payload = JSON.parse(stored) as JwtPayload;
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      expiresIn: this.getExpirationSeconds('JWT_ACCESS_EXPIRATION', '15m'),
    };
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`Logout para usuario ${userId}`);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new ConflictException('La nueva contraseña no puede ser igual a la actual');
    }

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
    const newHash = await bcrypt.hash(dto.newPassword, rounds);
    await this.usersService.updatePassword(user.id, newHash);
    return { success: true };
  }

  async verify2FA(
    userId: string,
    dto: Verify2FADto,
  ): Promise<{ verified: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user?.twoFactorSecret) {
      throw new UnauthorizedException('2FA no configurado');
    }
    const valid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });
    return { verified: valid };
  }

  private async issueTokens(user: {
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
    lastLoginAt: Date | null;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthenticatedUser;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTtl = this.getExpirationSeconds('JWT_REFRESH_EXPIRATION', '7d');

    await this.redis.set(
      `refresh:${refreshTokenHash}`,
      JSON.stringify(payload),
      refreshTtl,
    );

    const authenticated: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      territories: user.territories,
      twoFactorEnabled: user.twoFactorEnabled,
      forcePasswordChange: user.forcePasswordChange,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpirationSeconds('JWT_ACCESS_EXPIRATION', '15m'),
      user: authenticated,
    };
  }

  private getExpirationSeconds(envVar: string, defaultValue: string): number {
    const raw = this.config.get<string>(envVar, defaultValue);
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const num = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return num * (multipliers[unit] ?? 1);
  }
}
