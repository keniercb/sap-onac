import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovementDto {
  @ApiProperty({ description: 'ID numérico del pensionado' })
  @IsInt() @IsPositive()
  pensionerId!: number;

  @ApiProperty({ enum: ['alta', 'baja', 'reincorporacion_sma'], description: 'Tipo de movimiento' })
  @IsEnum(['alta', 'baja', 'reincorporacion_sma'])
  movementType!: 'alta' | 'baja' | 'reincorporacion_sma';

  @ApiProperty({ example: '2026-09-10', description: 'Fecha del movimiento (YYYY-MM-DD)' })
  @IsDateString()
  movementDate!: string;

  @ApiPropertyOptional({ description: 'ID de la causa (de cat_movement_cause)' })
  @IsOptional() @IsInt() @IsPositive()
  causeId?: number;

  @ApiPropertyOptional({ description: 'Descripción libre de la causa' })
  @IsOptional() @IsString() @MaxLength(255)
  causeDescription?: string;

  @ApiPropertyOptional({ description: 'No. de acuerdo/resolución' })
  @IsOptional() @IsString() @MaxLength(50)
  agreementNumber?: string;

  @ApiPropertyOptional({ description: 'Fecha de la resolución' })
  @IsOptional() @IsDateString()
  agreementDate?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional() @IsString()
  notes?: string;
}

export class MovementFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por pensionado' })
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  pensionerId?: number;

  @ApiPropertyOptional({ enum: ['alta', 'baja', 'reincorporacion_sma'] })
  @IsOptional() @IsEnum(['alta', 'baja', 'reincorporacion_sma'])
  movementType?: string;

  @ApiPropertyOptional({ description: 'Fecha inicial (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha final (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 50;
}
