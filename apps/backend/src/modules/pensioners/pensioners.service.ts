import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PensionerState as PrismaPensionerState } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';

export interface PensionerQuery {
  page?: number;
  pageSize?: number;
  provinceId?: number;
  municipalityId?: number;
  categoryId?: number;
  currentState?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  territoryFilter?: {
    provinces?: number[] | null;
    municipalities?: number[] | null;
  };
}

/**
 * Valida el dígito verificador del Carnet de Identidad cubano.
 * Pesos: 1,2,1,2,1,2,1,2,1,2 sobre los primeros 10 dígitos;
 * si una multiplicación da >9, se resta 9; el dígito verificador es (10 - sum%10) % 10.
 */
function isValidCubanCI(ci: string): boolean {
  if (!/^\d{11}$/.test(ci)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const partial = Number(ci[i]) * weights[i];
    sum += partial > 9 ? partial - 9 : partial;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(ci[10]);
}

@Injectable()
export class PensionersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: PensionerQuery = {}) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(params.pageSize ?? 50, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.PensionerWhereInput = {
      deletedAt: null,
      ...(params.provinceId ? { provinceId: BigInt(params.provinceId) } : {}),
      ...(params.municipalityId ? { municipalityId: BigInt(params.municipalityId) } : {}),
      ...(params.categoryId ? { categoryId: BigInt(params.categoryId) } : {}),
      ...(params.currentState ? { currentState: params.currentState as PrismaPensionerState } : {}),
      ...(params.search
        ? {
            OR: [
              { identityCard: { contains: params.search } },
              { firstName: { contains: params.search } },
              { lastName1: { contains: params.search } },
              { lastName2: { contains: params.search } },
              { knownAs: { contains: params.search } },
              { certificateSerial: { contains: params.search } },
            ],
          }
        : {}),
    };

    // Aplicar filtro territorial automático (TerritoryInterceptor)
    if (params.territoryFilter) {
      const tf = params.territoryFilter;
      if (tf.provinces === null && tf.municipalities === null) {
        // Admin o Auditor: sin restricción
      } else {
        const orClauses: Prisma.PensionerWhereInput[] = [];
        if (tf.provinces && tf.provinces.length > 0) {
          orClauses.push({
            provinceId: { in: tf.provinces.map((p) => BigInt(p)) },
            municipalityId: tf.municipalities && tf.municipalities.length > 0
              ? undefined
              : undefined,
          });
        }
        if (tf.municipalities && tf.municipalities.length > 0) {
          orClauses.push({
            municipalityId: { in: tf.municipalities.map((m) => BigInt(m)) },
          });
        }
        if (orClauses.length > 0) {
          (where as Prisma.PensionerWhereInput).AND = [
            ...(Array.isArray((where as Prisma.PensionerWhereInput).AND)
              ? ((where as Prisma.PensionerWhereInput).AND as Prisma.PensionerWhereInput[])
              : []),
            { OR: orClauses },
          ];
        } else {
          // Usuario con territorio pero sin asignación concreta → no ve nada
          (where as Prisma.PensionerWhereInput).id = { in: [] };
        }
      }
    }

    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';
    const orderBy: Prisma.PensionerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.pensioner.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          province: true,
          municipality: true,
          sex: true,
          skinColor: true,
          healthStatus: true,
          category: true,
          civilStatus: true,
          laborLink: true,
          pensionType: true,
          housingType: true,
          propertyType: true,
        },
      }),
      this.prisma.pensioner.count({ where }),
    ]);

    return {
      items: items.map(this.serialize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: bigint) {
    const pensioner = await this.prisma.pensioner.findUnique({
      where: { id },
      include: {
        province: true,
        municipality: true,
        sex: true,
        skinColor: true,
        healthStatus: true,
        category: true,
        civilStatus: true,
        laborLink: true,
        pensionType: true,
        housingType: true,
        propertyType: true,
        movements: { orderBy: { movementDate: 'desc' } },
      },
    });
    if (!pensioner || pensioner.deletedAt) {
      throw new NotFoundException(`Pensionado ${id} no encontrado`);
    }
    return this.serialize(pensioner);
  }

  async create(data: {
    identityCard: string;
    certificateSerial?: string;
    firstName: string;
    lastName1: string;
    lastName2?: string;
    knownAs?: string;
    address?: string;
    provinceId: number;
    municipalityId: number;
    sexId?: number;
    skinColorId?: number;
    healthStatusId?: number;
    categoryId?: number;
    civilStatusId?: number;
    laborLinkId?: number;
    salary?: number;
    aep?: boolean;
    pmtAmount?: number;
    pensionTypeId?: number;
    grantedBy?: string;
    socialSecurityPension?: number;
    bankControlNumber?: string;
    housingTypeId?: number;
    propertyTypeId?: number;
  }) {
    // Validación de Carnet de Identidad cubano
    if (!isValidCubanCI(data.identityCard)) {
      throw new BadRequestException('Carnet de Identidad inválido (formato o dígito verificador incorrecto)');
    }

    // Verificar duplicidad de CI
    const exists = await this.prisma.pensioner.findUnique({
      where: { identityCard: data.identityCard },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un pensionado con CI ${data.identityCard}`,
      );
    }

    // Validar que el municipio pertenezca a la provincia
    const municipality = await this.prisma.catMunicipality.findUnique({
      where: { id: BigInt(data.municipalityId) },
    });
    if (!municipality || municipality.provinceId !== BigInt(data.provinceId)) {
      throw new BadRequestException(
        'El municipio seleccionado no pertenece a la provincia indicada',
      );
    }

    const consecutiveNumber = await this.nextConsecutiveNumber();

    const payload: Prisma.PensionerCreateInput = {
      uuid: crypto.randomUUID(),
      consecutiveNumber,
      identityCard: data.identityCard,
      certificateSerial: data.certificateSerial ?? null,
      firstName: data.firstName,
      lastName1: data.lastName1,
      lastName2: data.lastName2 ?? null,
      knownAs: data.knownAs ?? null,
      address: data.address ?? null,
      province: { connect: { id: BigInt(data.provinceId) } },
      municipality: { connect: { id: BigInt(data.municipalityId) } },
      sex: data.sexId ? { connect: { id: BigInt(data.sexId) } } : undefined,
      skinColor: data.skinColorId ? { connect: { id: BigInt(data.skinColorId) } } : undefined,
      healthStatus: data.healthStatusId ? { connect: { id: BigInt(data.healthStatusId) } } : undefined,
      category: data.categoryId ? { connect: { id: BigInt(data.categoryId) } } : undefined,
      civilStatus: data.civilStatusId ? { connect: { id: BigInt(data.civilStatusId) } } : undefined,
      laborLink: data.laborLinkId ? { connect: { id: BigInt(data.laborLinkId) } } : undefined,
      salary: data.salary ?? null,
      aep: data.aep ?? false,
      pmtAmount: data.pmtAmount ?? null,
      pensionType: data.pensionTypeId ? { connect: { id: BigInt(data.pensionTypeId) } } : undefined,
      grantedBy: data.grantedBy ?? null,
      socialSecurityPension: data.socialSecurityPension ?? null,
      bankControlNumber: data.bankControlNumber ?? null,
      housingType: data.housingTypeId ? { connect: { id: BigInt(data.housingTypeId) } } : undefined,
      propertyType: data.propertyTypeId ? { connect: { id: BigInt(data.propertyTypeId) } } : undefined,
      currentState: 'active',
    };

    const created = await this.prisma.pensioner.create({
      data: payload,
      include: {
        province: true,
        municipality: true,
        category: true,
      },
    });

    // Crear automáticamente un movimiento de alta inicial
    await this.prisma.movement.create({
      data: {
        uuid: crypto.randomUUID(),
        pensioner: { connect: { id: created.id } },
        movementType: 'alta',
        movementDate: new Date(),
        causeDescription: 'Alta inicial al crear el pensionado',
      },
    });

    return this.serialize(created);
  }

  async update(
    id: bigint,
    data: {
      identityCard?: string;
      firstName?: string;
      lastName1?: string;
      lastName2?: string;
      knownAs?: string;
      address?: string;
      provinceId?: number;
      municipalityId?: number;
      sexId?: number;
      skinColorId?: number;
      healthStatusId?: number;
      categoryId?: number;
      civilStatusId?: number;
      laborLinkId?: number;
      salary?: number;
      aep?: boolean;
      pmtAmount?: number;
      pensionTypeId?: number;
      grantedBy?: string;
      socialSecurityPension?: number;
      bankControlNumber?: string;
      housingTypeId?: number;
      propertyTypeId?: number;
      version: number;
    },
  ) {
    const existing = await this.prisma.pensioner.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Pensionado ${id} no encontrado`);
    }
    if (existing.version !== data.version) {
      throw new ConflictException(
        `Versión obsoleta. El registro fue modificado por otro usuario. Versión actual: ${existing.version}`,
      );
    }

    if (data.identityCard && !isValidCubanCI(data.identityCard)) {
      throw new BadRequestException('Carnet de Identidad inválido');
    }

    if (data.identityCard && data.identityCard !== existing.identityCard) {
      const dup = await this.prisma.pensioner.findUnique({
        where: { identityCard: data.identityCard },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException(`Ya existe un pensionado con CI ${data.identityCard}`);
      }
    }

    const payload: Prisma.PensionerUpdateInput = { version: existing.version + 1 };
    if (data.identityCard !== undefined) payload.identityCard = data.identityCard;
    if (data.firstName !== undefined) payload.firstName = data.firstName;
    if (data.lastName1 !== undefined) payload.lastName1 = data.lastName1;
    if (data.lastName2 !== undefined) payload.lastName2 = data.lastName2;
    if (data.knownAs !== undefined) payload.knownAs = data.knownAs;
    if (data.address !== undefined) payload.address = data.address;
    if (data.provinceId !== undefined) payload.province = { connect: { id: BigInt(data.provinceId) } };
    if (data.municipalityId !== undefined) payload.municipality = { connect: { id: BigInt(data.municipalityId) } };
    if (data.sexId !== undefined) payload.sex = data.sexId ? { connect: { id: BigInt(data.sexId) } } : { disconnect: true };
    if (data.skinColorId !== undefined) payload.skinColor = data.skinColorId ? { connect: { id: BigInt(data.skinColorId) } } : { disconnect: true };
    if (data.healthStatusId !== undefined) payload.healthStatus = data.healthStatusId ? { connect: { id: BigInt(data.healthStatusId) } } : { disconnect: true };
    if (data.categoryId !== undefined) payload.category = data.categoryId ? { connect: { id: BigInt(data.categoryId) } } : { disconnect: true };
    if (data.civilStatusId !== undefined) payload.civilStatus = data.civilStatusId ? { connect: { id: BigInt(data.civilStatusId) } } : { disconnect: true };
    if (data.laborLinkId !== undefined) payload.laborLink = data.laborLinkId ? { connect: { id: BigInt(data.laborLinkId) } } : { disconnect: true };
    if (data.salary !== undefined) payload.salary = data.salary;
    if (data.aep !== undefined) payload.aep = data.aep;
    if (data.pmtAmount !== undefined) payload.pmtAmount = data.pmtAmount;
    if (data.pensionTypeId !== undefined) payload.pensionType = data.pensionTypeId ? { connect: { id: BigInt(data.pensionTypeId) } } : { disconnect: true };
    if (data.grantedBy !== undefined) payload.grantedBy = data.grantedBy;
    if (data.socialSecurityPension !== undefined) payload.socialSecurityPension = data.socialSecurityPension;
    if (data.bankControlNumber !== undefined) payload.bankControlNumber = data.bankControlNumber;
    if (data.housingTypeId !== undefined) payload.housingType = data.housingTypeId ? { connect: { id: BigInt(data.housingTypeId) } } : { disconnect: true };
    if (data.propertyTypeId !== undefined) payload.propertyType = data.propertyTypeId ? { connect: { id: BigInt(data.propertyTypeId) } } : { disconnect: true };

    const updated = await this.prisma.pensioner.update({
      where: { id },
      data: payload,
      include: {
        province: true,
        municipality: true,
        sex: true,
        skinColor: true,
        healthStatus: true,
        category: true,
        civilStatus: true,
        laborLink: true,
        pensionType: true,
        housingType: true,
        propertyType: true,
      },
    });
    return this.serialize(updated);
  }

  async softDelete(id: bigint) {
    const existing = await this.prisma.pensioner.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Pensionado ${id} no encontrado`);
    }
    await this.prisma.pensioner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  private async nextConsecutiveNumber(): Promise<number> {
    const max = await this.prisma.pensioner.aggregate({
      _max: { consecutiveNumber: true },
    });
    return (max._max.consecutiveNumber ?? 0) + 1;
  }

  /**
   * Serializa un pensioner para la respuesta:
   *   - BigInt → number
   *   - Date → ISO string
   *   - Añade fullName y displayName
   */
  private serialize = (p: Record<string, unknown>): Record<string, unknown> => {
    const firstName = String(p.firstName ?? '');
    const lastName1 = String(p.lastName1 ?? '');
    const lastName2 = p.lastName2 ? String(p.lastName2) : '';
    const knownAs = p.knownAs ? String(p.knownAs) : null;
    const fullName = [firstName, lastName1, lastName2].filter(Boolean).join(' ');
    const displayName = knownAs || fullName;

    const serializeRef = (ref: unknown): { id: number; code: string; name: string } | null => {
      if (!ref || typeof ref !== 'object') return null;
      const r = ref as Record<string, unknown>;
      return {
        id: typeof r.id === 'bigint' ? Number(r.id) : Number(r.id ?? 0),
        code: String(r.code ?? ''),
        name: String(r.name ?? ''),
      };
    };

    const toNum = (v: unknown): number | null => (v === null || v === undefined ? null : typeof v === 'bigint' ? Number(v) : Number(v));
    const toIso = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : String(v));
    const toNumOrStr = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'bigint') return Number(v);
      if (v instanceof Date) return null;
      return Number(v);
    };

    return {
      id: String(p.uuid ?? ''),
      numericId: toNum(p.id),
      consecutiveNumber: Number(p.consecutiveNumber ?? 0),
      identityCard: String(p.identityCard ?? ''),
      certificateSerial: p.certificateSerial ?? null,
      firstName,
      lastName1,
      lastName2: lastName2 || null,
      knownAs,
      fullName,
      displayName,
      address: p.address ?? null,
      provinceId: toNum(p.provinceId),
      municipalityId: toNum(p.municipalityId),
      sexId: toNumOrStr(p.sexId),
      skinColorId: toNumOrStr(p.skinColorId),
      healthStatusId: toNumOrStr(p.healthStatusId),
      categoryId: toNumOrStr(p.categoryId),
      civilStatusId: toNumOrStr(p.civilStatusId),
      laborLinkId: toNumOrStr(p.laborLinkId),
      salary: p.salary ? Number(p.salary) : null,
      aep: p.aep,
      pmtAmount: p.pmtAmount ? Number(p.pmtAmount) : null,
      pensionTypeId: toNumOrStr(p.pensionTypeId),
      grantedBy: p.grantedBy ?? null,
      socialSecurityPension: p.socialSecurityPension ? Number(p.socialSecurityPension) : null,
      bankControlNumber: p.bankControlNumber ?? null,
      housingTypeId: toNumOrStr(p.housingTypeId),
      propertyTypeId: toNumOrStr(p.propertyTypeId),
      currentState: p.currentState,
      deceasedAt: toIso(p.deceasedAt),
      version: Number(p.version ?? 1),
      createdAt: toIso(p.createdAt),
      updatedAt: toIso(p.updatedAt),
      // Refs (pueden no estar presentes si no se incluyeron)
      province: serializeRef(p.province),
      municipality: serializeRef(p.municipality),
      sex: serializeRef(p.sex),
      skinColor: serializeRef(p.skinColor),
      healthStatus: serializeRef(p.healthStatus),
      category: serializeRef(p.category),
      civilStatus: serializeRef(p.civilStatus),
      laborLink: serializeRef(p.laborLink),
      pensionType: serializeRef(p.pensionType),
      housingType: serializeRef(p.housingType),
      propertyType: serializeRef(p.propertyType),
    };
  };
}
