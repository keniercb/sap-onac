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
import { SolvedProblemsService } from './solved-problems.service';
import {
  CreateSolvedProblemDto,
  UpdateSolvedProblemDto,
  SolvedProblemFiltersDto,
} from './dto';

@ApiTags('solved-problems')
@Controller('solved-problems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolvedProblemsController {
  constructor(private readonly service: SolvedProblemsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar problemas resueltos con filtros' })
  async findMany(@Query() filters: SolvedProblemFiltersDto) {
    return this.service.findMany(filters);
  }

  @Get('pensioner/:pensionerId')
  @ApiOperation({ summary: 'Listar problemas resueltos de un pensionado' })
  async findByPensioner(@Param('pensionerId') pensionerId: string) {
    return this.service.findByPensioner(Number(pensionerId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un problema resuelto por id' })
  async findById(@Param('id') id: string) {
    return this.service.findById(Number(id));
  }

  @Post()
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Crear nuevo problema resuelto' })
  async create(@Body() dto: CreateSolvedProblemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN_ONAC', 'OPERADOR_PROVINCIAL', 'OPERADOR_MUNICIPAL')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Actualizar problema resuelto' })
  async update(@Param('id') id: string, @Body() dto: UpdateSolvedProblemDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @UseInterceptors(AuditInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar problema resuelto' })
  async remove(@Param('id') id: string) {
    await this.service.remove(Number(id));
  }
}
