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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { NeedsService } from './needs.service';
import { CreateNeedDto, UpdateNeedDto, NeedFiltersDto } from './dto';

@ApiTags('needs')
@Controller('needs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NeedsController {
  constructor(private readonly service: NeedsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar necesidades con filtros' })
  async findMany(@Query() filters: NeedFiltersDto) {
    return this.service.findMany(filters);
  }

  @Get('pensioner/:pensionerId')
  @ApiOperation({ summary: 'Listar necesidades de un pensionado específico' })
  async findByPensioner(@Param('pensionerId') pensionerId: string) {
    return this.service.findByPensioner(Number(pensionerId));
  }

  @Get('dashboard/:pensionerId')
  @ApiOperation({ summary: 'Tablero de atención por pensionado (indicadores)' })
  async getPensionerDashboard(@Param('pensionerId') pensionerId: string) {
    return this.service.getPensionerDashboard(Number(pensionerId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una necesidad por id' })
  async findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Post()
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Crear nueva necesidad' })
  async create(@Body() dto: CreateNeedDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Actualizar necesidad (estado, asignación, cierre)' })
  async update(@Param('id') id: string, @Body() dto: UpdateNeedDto) {
    return this.service.update(Number(id), dto);
  }

  @Post(':id/reassign')
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Reasignar responsabilidad de la necesidad' })
  async reassign(
    @Param('id') id: string,
    @Body() body: { assignedToId: string | null; version: number },
  ) {
    return this.service.reassign(Number(id), body.assignedToId, body.version);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar necesidad' })
  async remove(@Param('id') id: string) {
    await this.service.remove(Number(id));
  }
}
