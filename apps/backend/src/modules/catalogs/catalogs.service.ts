import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';

/**
 * Catálogos soportados por el sistema. La clave es el código público
 * expuesto vía API; el valor es el nombre del modelo Prisma correspondiente.
 */
const CATALOG_REGISTRY = {
  province: { model: 'catProvince', name: 'Provincias', hierarchical: false },
  municipality: { model: 'catMunicipality', name: 'Municipios', hierarchical: true },
  sex: { model: 'catSex', name: 'Sexo', hierarchical: false },
  skin_color: { model: 'catSkinColor', name: 'Color de piel', hierarchical: false },
  health_status: { model: 'catHealthStatus', name: 'Estado de salud', hierarchical: false },
  pensioner_category: { model: 'catPensionerCategory', name: 'Categorías de pensionados', hierarchical: false },
  civil_status: { model: 'catCivilStatus', name: 'Estado civil', hierarchical: false },
  labor_link: { model: 'catLaborLink', name: 'Vínculo laboral', hierarchical: false },
  pension_type: { model: 'catPensionType', name: 'Tipo de pensión', hierarchical: false },
  housing_type: { model: 'catHousingType', name: 'Tipos de vivienda', hierarchical: false },
  property_type: { model: 'catPropertyType', name: 'Tipos de propiedad', hierarchical: false },
} as const;

export type CatalogCode = keyof typeof CATALOG_REGISTRY;
type ModelDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown | null>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  count: (args?: unknown) => Promise<number>;
};

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista los catálogos disponibles con metadatos.
   */
  async listCatalogs() {
    return Object.entries(CATALOG_REGISTRY).map(([code, def]) => ({
      code,
      name: def.name,
      hierarchical: def.hierarchical,
    }));
  }

  private getDelegate(catalog: string): ModelDelegate {
    const def = CATALOG_REGISTRY[catalog as CatalogCode];
    if (!def) {
      throw new BadRequestException(`Catálogo '${catalog}' no es válido`);
    }
    return (this.prisma as unknown as Record<string, ModelDelegate>)[def.model];
  }

  /**
   * Lista los items de un catálogo, con paginación opcional y filtro por activos.
   */
  async listItems(
    catalog: string,
    options: { onlyActive?: boolean; page?: number; pageSize?: number; search?: string } = {},
  ) {
    const delegate = this.getDelegate(catalog);
    const onlyActive = options.onlyActive ?? true;
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? 100, 500);

    const where: Record<string, unknown> = {};
    if (onlyActive) where.isActive = true;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { code: { contains: options.search } },
      ];
    }

    const findManyArgs: Record<string, unknown> = {
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    };

    // En catálogos jerárquicos (municipality) incluimos la provincia padre
    if (CATALOG_REGISTRY[catalog as CatalogCode].hierarchical) {
      findManyArgs.include = { province: true };
    }

    const [items, total] = await Promise.all([
      delegate.findMany(findManyArgs) as Promise<unknown[]>,
      delegate.count({ where }),
    ]);

    return {
      items: items.map(this.serializeItem),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Obtiene un item por id.
   */
  async findById(catalog: string, id: number) {
    const delegate = this.getDelegate(catalog);
    const findUniqueArgs: Record<string, unknown> = { where: { id: BigInt(id) } };
    if (CATALOG_REGISTRY[catalog as CatalogCode].hierarchical) {
      findUniqueArgs.include = { province: true };
    }
    const item = await delegate.findUnique(findUniqueArgs);
    if (!item) {
      throw new NotFoundException(`Item ${id} no encontrado en catálogo '${catalog}'`);
    }
    return this.serializeItem(item);
  }

  /**
   * Crea un nuevo item en el catálogo.
   */
  async create(catalog: string, data: { code: string; name: string; description?: string; sortOrder?: number; provinceId?: number }) {
    const delegate = this.getDelegate(catalog);

    // Verificar duplicidad de código
    const existing = await delegate.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException(`Ya existe un item con código '${data.code}'`);
    }

    const payload: Record<string, unknown> = {
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    };

    if (catalog === 'municipality') {
      if (!data.provinceId) {
        throw new BadRequestException('El provinceId es obligatorio para municipios');
      }
      payload.provinceId = BigInt(data.provinceId);
    }

    try {
      const created = await delegate.create({ data: payload });
      return this.serializeItem(created);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`Ya existe un item con código '${data.code}'`);
      }
      throw err;
    }
  }

  /**
   * Actualiza un item existente.
   */
  async update(
    catalog: string,
    id: number,
    data: { code?: string; name?: string; description?: string; sortOrder?: number; isActive?: boolean; provinceId?: number },
  ) {
    const delegate = this.getDelegate(catalog);

    // Verificar existencia
    const existing = await delegate.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      throw new NotFoundException(`Item ${id} no encontrado`);
    }

    const payload: Record<string, unknown> = {};
    if (data.code !== undefined) payload.code = data.code;
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.provinceId !== undefined && catalog === 'municipality') {
      payload.provinceId = BigInt(data.provinceId);
    }

    try {
      const updated = await delegate.update({
        where: { id: BigInt(id) },
        data: payload,
      });
      return this.serializeItem(updated);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`El código '${data.code}' ya está en uso`);
      }
      throw err;
    }
  }

  /**
   * Borra un item (delete físico — usar update con isActive=false para soft delete).
   */
  async remove(catalog: string, id: number) {
    const delegate = this.getDelegate(catalog);
    const existing = await delegate.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      throw new NotFoundException(`Item ${id} no encontrado`);
    }
    try {
      await delegate.delete({ where: { id: BigInt(id) } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException(
          `No se puede eliminar: el item está referenciado por otros registros. Use update con isActive=false para desactivarlo.`,
        );
      }
      throw err;
    }
    return { success: true };
  }

  /**
   * Serializa un item para la respuesta (BigInt → number, fechas → ISO string).
   */
  private serializeItem = (item: unknown): Record<string, unknown> => {
    if (!item || typeof item !== 'object') return {};
    const obj = item as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'bigint') {
        result[key] = Number(value);
      } else if (value instanceof Date) {
        result[key] = value.toISOString();
      } else if (value && typeof value === 'object' && 'id' in (value as object)) {
        // Anidado (province, etc.)
        const nested = value as Record<string, unknown>;
        result[key] = {
          id: typeof nested.id === 'bigint' ? Number(nested.id) : nested.id,
          name: nested.name,
          code: nested.code,
        };
      } else {
        result[key] = value;
      }
    }
    return result;
  };
}
