import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, Matches } from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({ example: 'PRIMER_CORONEL', description: 'Código único (mayúsculas, números, _)' })
  @IsString() @MaxLength(20) @Matches(/^[A-Z0-9_]+$/, { message: 'Solo mayúsculas, números y _' })
  code!: string;

  @ApiProperty({ example: 'Primer Coronel', description: 'Nombre visible' })
  @IsString() @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción larga' })
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ID de la provincia (solo para municipios)' })
  @IsOptional() @IsInt() @Min(1)
  provinceId?: number;
}

export class UpdateCatalogItemDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(20) @Matches(/^[A-Z0-9_]+$/)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1)
  provinceId?: number;
}
