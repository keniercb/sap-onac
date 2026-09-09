import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin.onac', description: 'Nombre de usuario' })
  @IsString() @IsNotEmpty() @MaxLength(50)
  username!: string;

  @ApiProperty({ example: 'ChangeMe!2026', description: 'Contraseña' })
  @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(255)
  password!: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código 2FA (TOTP)' })
  @IsOptional() @IsString() @Matches(/^\d{6}$/, { message: 'El código 2FA debe ser 6 dígitos' })
  twoFactorCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token recibido en login' })
  @IsString() @IsNotEmpty()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString() @IsNotEmpty() @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ description: 'Nueva contraseña (mínimo 8 chars, mayúscula, minúscula, número, símbolo)' })
  @IsString() @MinLength(8) @MaxLength(255)
  @Matches(/[A-Z]/, { message: 'Debe incluir al menos una mayúscula' })
  @Matches(/[a-z]/, { message: 'Debe incluir al menos una minúscula' })
  @Matches(/[0-9]/, { message: 'Debe incluir al menos un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Debe incluir al menos un símbolo' })
  newPassword!: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString() @Matches(/^\d{6}$/, { message: 'El código debe ser 6 dígitos' })
  code!: string;
}

export class Enable2FADto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsString() @IsNotEmpty()
  password!: string;
}
