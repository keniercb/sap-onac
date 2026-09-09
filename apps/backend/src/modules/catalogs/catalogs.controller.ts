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
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogItemDto, UpdateCatalogItemDto } from './dto';

@ApiTags('catalogs')
@Controller('catalogs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los catálogos (nomencladores) disponibles' })
  async listCatalogs() {
    return this.service.listCatalogs();
  }

  @Get(':catalog')
  @ApiOperation({ summary: 'Lista los items de un catálogo' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listItems(
    @Param('catalog') catalog: string,
    @Query('onlyActive') onlyActive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listItems(catalog, {
      onlyActive: onlyActive === undefined ? undefined : onlyActive === 'true',
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
    });
  }

  @Get(':catalog/:id')
  @ApiOperation({ summary: 'Obtiene un item por id' })
  async findById(@Param('catalog') catalog: string, @Param('id') id: string) {
    return this.service.findById(catalog, Number(id));
  }

  @Post(':catalog')
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Crea un nuevo item en el catálogo' })
  async create(
    @Param('catalog') catalog: string,
    @Body() dto: CreateCatalogItemDto,
  ) {
    return this.service.create(catalog, dto);
  }

  @Patch(':catalog/:id')
  @Roles('ADMIN_ONAC')
  @ApiOperation({ summary: 'Actualiza un item del catálogo' })
  async update(
    @Param('catalog') catalog: string,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.service.update(catalog, Number(id), dto);
  }

  @Delete(':catalog/:id')
  @Roles('ADMIN_ONAC')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un item del catálogo' })
  async remove(@Param('catalog') catalog: string, @Param('id') id: string) {
    await this.service.remove(catalog, Number(id));
  }
}
