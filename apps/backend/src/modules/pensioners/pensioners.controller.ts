import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { TerritoryInterceptor, TerritoryFilter } from '@common/interceptors/territory.interceptor';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PensionersService } from './pensioners.service';
import { CreatePensionerDto, UpdatePensionerDto, PensionerFiltersDto } from './dto';

@ApiTags('pensioners')
@Controller('pensioners')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TerritoryInterceptor)
export class PensionersController {
  constructor(private readonly service: PensionersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pensionados paginados (con filtro territorial automático)' })
  async findMany(@Query() filters: PensionerFiltersDto, @Req() req: Request & { territoryFilter?: TerritoryFilter }) {
    return this.service.findMany({
      ...filters,
      territoryFilter: req.territoryFilter,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pensionado por id (numérico BigInt)' })
  async findById(@Param('id') id: string) {
    return this.service.findById(BigInt(id));
  }

  @Post()
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Crear nuevo pensionado' })
  async create(@Body() dto: CreatePensionerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Actualizar pensionado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePensionerDto,
  ) {
    return this.service.update(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar (soft delete) pensionado' })
  async remove(@Param('id') id: string) {
    await this.service.softDelete(BigInt(id));
  }
}
