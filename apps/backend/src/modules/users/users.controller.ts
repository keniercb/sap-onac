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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
} from './dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Listar usuarios' })
  async findMany(
    @Query('search') search?: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.usersService.findMany({
      search,
      onlyActive: onlyActive === undefined ? undefined : onlyActive === 'true',
    });
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  async listRoles() {
    return this.usersService.listRoles();
  }

  @Get('permissions')
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Listar permisos del sistema' })
  async listPermissions() {
    return this.usersService.listPermissions();
  }

  @Get('me')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado actual' })
  async me() {
    // Implementación simplificada: en el guard JWT se completa request.user
    return { message: 'Endpoint en construcción' };
  }

  @Get(':id')
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Obtener un usuario por id' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } };
    }
    // Omitir secrets en respuesta
    const { passwordHash, twoFactorSecret, ...safe } = user as Record<string, unknown>;
    return safe;
  }

  @Post()
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Actualizar usuario (datos, roles, territorios)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN_ONAC')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña del usuario' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto.newPassword);
  }

  @Delete(':id')
  @Roles('ADMIN_ONAC')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar usuario (soft delete)' })
  async deactivate(@Param('id') id: string) {
    await this.usersService.deactivate(id);
  }
}
