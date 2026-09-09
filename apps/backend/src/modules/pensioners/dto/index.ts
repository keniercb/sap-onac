import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum PensionerState {
  Active = 'active',
  Inactive = 'inactive',
  Deceased = 'deceased',
  ReincorporatedSma = 'reincorporated_sma',
}

export class CreatePensionerDto {
  @ApiProperty({ example: '78010112345', description: 'Carnet de Identidad cubano (11 dígitos)' })
  @IsString() @MaxLength(11) @Min(11, { message: 'El CI debe tener 11 dígitos' })
  identityCard!: string;

  @ApiPropertyOptional({ description: 'No. de serie del certifico' })
  @IsOptional() @IsString() @MaxLength(50)
  certificateSerial?: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString() @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'Primer apellido' })
  @IsString() @MaxLength(100)
  lastName1!: string;

  @ApiPropertyOptional({ description: 'Segundo apellido' })
  @IsOptional() @IsString() @MaxLength(100)
  lastName2?: string;

  @ApiPropertyOptional({ description: 'Conocido por' })
  @IsOptional() @IsString() @MaxLength(150)
  knownAs?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsOptional() @IsString() @MaxLength(500)
  address?: string;

  @ApiProperty({ description: 'ID de la provincia' })
  @IsInt() @IsPositive()
  provinceId!: number;

  @ApiProperty({ description: 'ID del municipio' })
  @IsInt() @IsPositive()
  municipalityId!: number;

  @ApiPropertyOptional({ description: 'ID de sexo' })
  @IsOptional() @IsInt() @IsPositive()
  sexId?: number;

  @ApiPropertyOptional({ description: 'ID de color de piel' })
  @IsOptional() @IsInt() @IsPositive()
  skinColorId?: number;

  @ApiPropertyOptional({ description: 'ID de estado de salud' })
  @IsOptional() @IsInt() @IsPositive()
  healthStatusId?: number;

  @ApiPropertyOptional({ description: 'ID de categoría' })
  @IsOptional() @IsInt() @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'ID de estado civil' })
  @IsOptional() @IsInt() @IsPositive()
  civilStatusId?: number;

  @ApiPropertyOptional({ description: 'ID de vínculo laboral' })
  @IsOptional() @IsInt() @IsPositive()
  laborLinkId?: number;

  @ApiPropertyOptional({ description: 'Salario actual' })
  @IsOptional() @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ description: 'AEP (Aporte Estatal Pensional)' })
  @IsOptional() @IsBoolean()
  aep?: boolean;

  @ApiPropertyOptional({ description: 'Cuantía PMT' })
  @IsOptional() @IsNumber()
  pmtAmount?: number;

  @ApiPropertyOptional({ description: 'ID de tipo de pensión' })
  @IsOptional() @IsInt() @IsPositive()
  pensionTypeId?: number;

  @ApiPropertyOptional({ description: 'Otorgada por' })
  @IsOptional() @IsString() @MaxLength(150)
  grantedBy?: string;

  @ApiPropertyOptional({ description: 'Pensión de Seguridad Social' })
  @IsOptional() @IsNumber()
  socialSecurityPension?: number;

  @ApiPropertyOptional({ description: 'No. de Control Bancario' })
  @IsOptional() @IsString() @MaxLength(20)
  bankControlNumber?: string;

  @ApiPropertyOptional({ description: 'ID de tipo de vivienda' })
  @IsOptional() @IsInt() @IsPositive()
  housingTypeId?: number;

  @ApiPropertyOptional({ description: 'ID de tipo de propiedad' })
  @IsOptional() @IsInt() @IsPositive()
  propertyTypeId?: number;
}

export class UpdatePensionerDto {
  @IsOptional() @IsString()
  identityCard?: string;

  @IsOptional() @IsString()
  firstName?: string;

  @IsOptional() @IsString()
  lastName1?: string;

  @IsOptional() @IsString()
  lastName2?: string;

  @IsOptional() @IsString()
  knownAs?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsInt() @IsPositive()
  provinceId?: number;

  @IsOptional() @IsInt() @IsPositive()
  municipalityId?: number;

  @IsOptional() @IsInt() @IsPositive()
  healthStatusId?: number;

  @IsOptional() @IsInt() @IsPositive()
  categoryId?: number;

  @IsOptional() @IsNumber()
  salary?: number;

  @IsOptional() @IsString()
  bankControlNumber?: string;

  @ApiProperty({ description: 'Versión para control de concurrencia' })
  @IsInt() @Min(1)
  version!: number;
}

export class PensionerFiltersDto {
  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Tamaño de página', default: 50, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 50;

  @ApiPropertyOptional({ description: 'Filtrar por provincia' })
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  provinceId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por municipio' })
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  municipalityId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({ enum: PensionerState, description: 'Filtrar por estado' })
  @IsOptional() @IsEnum(PensionerState)
  currentState?: PensionerState;

  @ApiPropertyOptional({ description: 'Búsqueda por CI o nombre' })
  @IsOptional() @IsString() @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Ordenar por', default: 'createdAt' })
  @IsOptional() @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
