import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TerritoryDto {
  @ApiProperty({ description: 'Código del rol al que aplica el territorio' })
  @IsString()
  roleCode!: string;

  @ApiPropertyOptional({ description: 'ID de provincia (obligatorio para OPERADOR_PROVINCIAL y OPERADOR_MUNICIPAL)' })
  @IsOptional() @IsInt() @IsPositive()
  provinceId?: number;

  @ApiPropertyOptional({ description: 'ID de municipio (obligatorio para OPERADOR_MUNICIPAL)' })
  @IsOptional() @IsInt() @IsPositive()
  municipalityId?: number;
}

export class CreateUserDto {
  @ApiProperty({ example: 'operador.habana' })
  @IsString() @MinLength(3) @MaxLength(50) @Matches(/^[a-z0-9._]+$/, {
    message: 'Solo minúsculas, números, puntos y guion bajo',
  })
  username!: string;

  @ApiProperty({ example: 'operador@onac.cu' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Contraseña inicial' })
  @IsString() @MinLength(8) @MaxLength(255)
  @Matches(/[A-Z]/, { message: 'Debe incluir al menos una mayúscula' })
  @Matches(/[a-z]/, { message: 'Debe incluir al menos una minúscula' })
  @Matches(/[0-9]/, { message: 'Debe incluir al menos un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Debe incluir al menos un símbolo' })
  password!: string;

  @ApiProperty({ example: 'Operador Habana' })
  @IsString() @MaxLength(255)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Operador provincial' })
  @IsOptional() @IsString() @MaxLength(150)
  position?: string;

  @ApiProperty({ type: [String], description: 'Códigos de roles a asignar', example: ['OPERADOR_PROVINCIAL'] })
  @IsArray() @ArrayMinSize(1) @IsString({ each: true })
  roleCodes!: string[];

  @ApiProperty({ type: [TerritoryDto], description: 'Asignación territorial por rol' })
  @IsArray() @ValidateNested({ each: true })
  @Type(() => TerritoryDto)
  territories!: TerritoryDto[];
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  position?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  roleCodes?: string[];

  @ApiPropertyOptional({ type: [TerritoryDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => TerritoryDto)
  territories?: TerritoryDto[];
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString() @MinLength(8) @MaxLength(255)
  @Matches(/[A-Z]/, { message: 'Debe incluir al menos una mayúscula' })
  @Matches(/[a-z]/, { message: 'Debe incluir al menos una minúscula' })
  @Matches(/[0-9]/, { message: 'Debe incluir al menos un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Debe incluir al menos un símbolo' })
  newPassword!: string;
}
