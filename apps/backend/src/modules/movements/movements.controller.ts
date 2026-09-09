import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { MovementsService } from './movements.service';
import { CreateMovementDto, MovementFiltersDto } from './dto';

@ApiTags('movements')
@Controller('movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovementsController {
  constructor(private readonly service: MovementsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar movimientos con filtros' })
  async findMany(@Query() filters: MovementFiltersDto) {
    return this.service.findMany(filters);
  }

  @Get('causes')
  @ApiOperation({ summary: 'Listar causas de movimiento (nomenclador)' })
  async listCauses(@Query('appliesTo') appliesTo?: string) {
    return this.service.listCauses(appliesTo);
  }

  @Get('pensioner/:pensionerId')
  @ApiOperation({ summary: 'Listar movimientos de un pensionado específico' })
  async findByPensioner(@Param('pensionerId') pensionerId: string) {
    return this.service.findByPensioner(Number(pensionerId));
  }

  @Post()
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Registrar nuevo movimiento (alta, baja o reincorporación SMA)' })
  async create(@Body() dto: CreateMovementDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Eliminar movimiento (solo último registrado)' })
  async remove(@Param('id') id: string) {
    await this.service.remove(Number(id));
  }
}
