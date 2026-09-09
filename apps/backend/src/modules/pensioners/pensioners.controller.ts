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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { PensionersService } from './pensioners.service';
import { CreatePensionerDto, UpdatePensionerDto, PensionerFiltersDto } from './dto';

@ApiTags('pensioners')
@Controller('pensioners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PensionersController {
  constructor(private readonly service: PensionersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pensionados paginados' })
  async findMany(@Query() filters: PensionerFiltersDto) {
    return this.service.findMany(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pensionado por id (numérico BigInt)' })
  async findById(@Param('id') id: string) {
    return this.service.findById(BigInt(id));
  }

  @Post()
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @ApiOperation({ summary: 'Crear nuevo pensionado' })
  async create(@Body() dto: CreatePensionerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @ApiOperation({ summary: 'Actualizar pensionado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePensionerDto,
  ) {
    return this.service.update(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar (soft delete) pensionado' })
  async remove(@Param('id') id: string) {
    await this.service.softDelete(BigInt(id));
  }
}
