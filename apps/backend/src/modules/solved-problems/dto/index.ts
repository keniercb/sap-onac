import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSolvedProblemDto {
  @ApiProperty({ description: 'ID del pensionado' })
  @IsInt() @IsPositive()
  pensionerId!: number;

  @ApiProperty({ description: 'Descripción del problema resuelto' })
  @IsString() @MinLength(1) @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ description: 'Tipo de solución aplicada' })
  @IsOptional() @IsString() @MaxLength(100)
  solutionType?: string;

  @ApiProperty({ description: 'Fecha de resolución (YYYY-MM-DD)' })
  @IsDateString()
  resolutionDate!: string;

  @ApiPropertyOptional({ description: 'ID del usuario responsable' })
  @IsOptional() @IsString()
  responsibleId?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateSolvedProblemDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(1) @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  solutionType?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  resolutionDate?: string;

  @ApiPropertyOptional({ description: 'null para desasignar responsable' })
  @IsOptional()
  responsibleId?: string | null;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class SolvedProblemFiltersDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  pensionerId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  responsibleId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 50;
}
