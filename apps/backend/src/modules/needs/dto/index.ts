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
  MinLength,
} from 'class-validator';

export class CreateNeedDto {
  @ApiProperty({ description: 'ID del pensionado' })
  @IsInt() @IsPositive()
  pensionerId!: number;

  @ApiProperty({ description: 'ID del tipo de necesidad (salud, electrodomésticos, otras)' })
  @IsInt() @IsPositive()
  needTypeId!: number;

  @ApiPropertyOptional({ description: 'ID del electrodoméstico (si es de tipo electrodomésticos)' })
  @IsOptional() @IsInt() @IsPositive()
  electrodomesticTypeId?: number;

  @ApiPropertyOptional({ description: 'Cantidad (para electrodomésticos)', default: 1 })
  @IsOptional() @IsInt() @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Descripción de la necesidad' })
  @IsString() @MinLength(1) @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'], default: 'medium' })
  @IsOptional() @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ description: 'ID del usuario responsable asignado' })
  @IsOptional() @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Fecha de identificación (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  identifiedAt?: string;

  @ApiPropertyOptional({ description: 'Fecha objetivo de resolución (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  targetDate?: string;
}

export class UpdateNeedDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ enum: ['pending', 'in_progress', 'resolved', 'cancelled'] })
  @IsOptional() @IsEnum(['pending', 'in_progress', 'resolved', 'cancelled'])
  status?: 'pending' | 'in_progress' | 'resolved' | 'cancelled';

  @ApiPropertyOptional({ description: 'ID del usuario responsable (null para desasignar)' })
  @IsOptional()
  assignedToId?: string | null;

  @ApiPropertyOptional({ description: 'Fecha objetivo (null para quitar)' })
  @IsOptional()
  targetDate?: string | null;

  @ApiPropertyOptional({ description: 'Justificación obligatoria al cerrar (RN-09)' })
  @IsOptional() @IsString() @MinLength(1)
  resolutionJustification?: string;

  @ApiPropertyOptional({ description: 'Tipo de solución aplicada' })
  @IsOptional() @IsString() @MaxLength(100)
  solutionType?: string;

  @ApiProperty({ description: 'Versión para control de concurrencia' })
  @IsInt() @Min(1)
  version!: number;
}

export class NeedFiltersDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  pensionerId?: number;

  @ApiPropertyOptional({ enum: ['pending', 'in_progress', 'resolved', 'cancelled'] })
  @IsOptional() @IsEnum(['pending', 'in_progress', 'resolved', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional() @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  needTypeId?: number;

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
