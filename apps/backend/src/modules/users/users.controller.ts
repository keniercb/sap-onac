import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  // UsersService se inyecta para uso en Fase 2 (gestión completa de usuarios)
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado actual' })
  async me() {
    // Implementación simplificada: en el guard JWT se completa request.user
    return { message: 'Endpoint en construcción' };
  }
}
