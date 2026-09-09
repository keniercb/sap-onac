import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { NeedPriority, NeedStatus } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';

export interface CreateNeedInput {
  pensionerId: number;
  needTypeId: number;
  electrodomesticTypeId?: number;
  quantity?: number;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  assignedToId?: string;
  identifiedAt?: string;
  targetDate?: string;
}

export interface UpdateNeedInput {
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  assignedToId?: string | null;
  targetDate?: string | null;
  resolutionJustification?: string;
  solutionType?: string;
  version: number;
}

export interface NeedQuery {
  pensionerId?: number;
  status?: string;
  priority?: string;
  assignedToId?: string;
  needTypeId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class NeedsService {
  private readonly logger = new Logger(NeedsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: NeedQuery = {}) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(params.pageSize ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params.pensionerId) where.pensionerId = BigInt(params.pensionerId);
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.needTypeId) where.needTypeId = BigInt(params.needTypeId);
    if (params.startDate || params.endDate) {
      where.identifiedAt = {};
      if (params.startDate) (where.identifiedAt as Record<string, unknown>).gte = new Date(params.startDate);
      if (params.endDate) (where.identifiedAt as Record<string, unknown>).lte = new Date(params.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.need.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { identifiedAt: 'desc' }],
        include: {
          pensioner: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName1: true,
              lastName2: true,
              knownAs: true,
              identityCard: true,
              province: true,
              municipality: true,
            },
          },
          needType: true,
          electrodomesticType: true,
          assignedTo: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.need.count({ where }),
    ]);

    return {
      items: items.map((n) => this.serialize(n)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByPensioner(pensionerId: number) {
    const items = await this.prisma.need.findMany({
      where: { pensionerId: BigInt(pensionerId) },
      orderBy: [{ status: 'asc' }, { identifiedAt: 'desc' }],
      include: {
        needType: true,
        electrodomesticType: true,
        assignedTo: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    return items.map((n) => this.serialize(n));
  }

  async findById(id: number) {
    const need = await this.prisma.need.findUnique({
      where: { id: BigInt(id) },
      include: {
        pensioner: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName1: true,
            lastName2: true,
            knownAs: true,
            identityCard: true,
            province: true,
            municipality: true,
          },
        },
        needType: true,
        electrodomesticType: true,
        assignedTo: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    if (!need) {
      throw new NotFoundException(`Necesidad ${id} no encontrada`);
    }
    return this.serialize(need);
  }

  async create(input: CreateNeedInput) {
    const pensioner = await this.prisma.pensioner.findUnique({
      where: { id: BigInt(input.pensionerId) },
    });
    if (!pensioner || pensioner.deletedAt) {
      throw new NotFoundException(`Pensionado ${input.pensionerId} no encontrado`);
    }

    const needType = await this.prisma.catNeedType.findUnique({
      where: { id: BigInt(input.needTypeId) },
    });
    if (!needType) {
      throw new BadRequestException(`Tipo de necesidad ${input.needTypeId} no encontrado`);
    }

    if (input.electrodomesticTypeId) {
      const electro = await this.prisma.catElectrodomestic.findUnique({
        where: { id: BigInt(input.electrodomesticTypeId) },
      });
      if (!electro) {
        throw new BadRequestException(`Electrodoméstico ${input.electrodomesticTypeId} no encontrado`);
      }
    }

    if (input.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.assignedToId },
      });
      if (!user || !user.isActive) {
        throw new BadRequestException(`Usuario asignado inválido o inactivo`);
      }
    }

    const need = await this.prisma.need.create({
      data: {
        uuid: crypto.randomUUID(),
        pensionerId: BigInt(input.pensionerId),
        needTypeId: BigInt(input.needTypeId),
        electrodomesticTypeId: input.electrodomesticTypeId ? BigInt(input.electrodomesticTypeId) : null,
        quantity: input.quantity ?? 1,
        description: input.description,
        priority: (input.priority ?? 'medium') as NeedPriority,
        status: 'pending' as NeedStatus,
        assignedToId: input.assignedToId ?? null,
        identifiedAt: input.identifiedAt ? new Date(input.identifiedAt) : new Date(),
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      },
      include: {
        needType: true,
        electrodomesticType: true,
        assignedTo: { select: { id: true, username: true, fullName: true } },
      },
    });

    return this.serialize(need);
  }

  async update(id: number, input: UpdateNeedInput) {
    const existing = await this.prisma.need.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Necesidad ${id} no encontrada`);
    }
    if (existing.version !== input.version) {
      throw new ConflictException(
        `Versión obsoleta. Versión actual: ${existing.version}`,
      );
    }

    const data: Record<string, unknown> = { version: existing.version + 1 };

    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.targetDate !== undefined) {
      data.targetDate = input.targetDate ? new Date(input.targetDate) : null;
    }
    if (input.assignedToId !== undefined) {
      data.assignedToId = input.assignedToId; // null para desasignar
    }

    // Cambio de estado
    if (input.status !== undefined && input.status !== existing.status) {
      // RN-05: Una necesidad cerrada no puede reabrirse; debe crearse una nueva
      if (existing.status === 'resolved' || existing.status === 'cancelled') {
        throw new BadRequestException(
          `No se puede modificar una necesidad ${existing.status}. Cree una nueva necesidad referenciando esta.`,
        );
      }
      // RN-09: Cerrar una necesidad requiere justificación
      if (input.status === 'resolved' || input.status === 'cancelled') {
        if (!input.resolutionJustification || input.resolutionJustification.trim().length === 0) {
          throw new BadRequestException(
            `Justificación obligatoria para cerrar una necesidad (RN-09)`,
          );
        }
        data.status = input.status;
        data.resolvedAt = new Date();
        data.resolutionJustification = input.resolutionJustification;
        if (input.solutionType) data.solutionType = input.solutionType;
      } else {
        data.status = input.status;
      }
    } else if (input.resolutionJustification !== undefined) {
      data.resolutionJustification = input.resolutionJustification;
    }
    if (input.solutionType !== undefined) data.solutionType = input.solutionType;

    const updated = await this.prisma.need.update({
      where: { id: BigInt(id) },
      data,
      include: {
        needType: true,
        electrodomesticType: true,
        assignedTo: { select: { id: true, username: true, fullName: true } },
      },
    });

    return this.serialize(updated);
  }

  /**
   * Reasigna la responsabilidad de una necesidad a otro usuario.
   */
  async reassign(id: number, newAssignedToId: string | null, version: number) {
    if (newAssignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: newAssignedToId },
      });
      if (!user || !user.isActive) {
        throw new BadRequestException(`Usuario asignado inválido o inactivo`);
      }
    }
    return this.update(id, { assignedToId: newAssignedToId, version });
  }

  async remove(id: number) {
    const existing = await this.prisma.need.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Necesidad ${id} no encontrada`);
    }
    await this.prisma.need.delete({ where: { id: BigInt(id) } });
    return { success: true };
  }

  /**
   * Tablero de atención por pensionado: necesidades abiertas, resueltas,
   * problemas resueltos y tiempo promedio de resolución.
   */
  async getPensionerDashboard(pensionerId: number) {
    const pensioner = await this.prisma.pensioner.findUnique({
      where: { id: BigInt(pensionerId) },
    });
    if (!pensioner || pensioner.deletedAt) {
      throw new NotFoundException(`Pensionado ${pensionerId} no encontrado`);
    }

    const [openNeeds, resolvedNeeds, solvedProblems, allNeeds] = await Promise.all([
      this.prisma.need.count({
        where: { pensionerId: BigInt(pensionerId), status: { in: ['pending', 'in_progress'] } },
      }),
      this.prisma.need.count({
        where: { pensionerId: BigInt(pensionerId), status: 'resolved' },
      }),
      this.prisma.solvedProblem.count({
        where: { pensionerId: BigInt(pensionerId) },
      }),
      this.prisma.need.findMany({
        where: {
          pensionerId: BigInt(pensionerId),
          status: 'resolved',
          identifiedAt: { not: undefined },
          resolvedAt: { not: undefined },
        },
        select: { identifiedAt: true, resolvedAt: true },
      }),
    ]);

    let avgResolutionDays: number | null = null;
    if (allNeeds.length > 0) {
      const totalDays = allNeeds.reduce((sum, n) => {
        if (n.identifiedAt && n.resolvedAt) {
          const diff = n.resolvedAt.getTime() - n.identifiedAt.getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      avgResolutionDays = Math.round(totalDays / allNeeds.length);
    }

    return {
      pensionerId: Number(pensioner.id),
      pensionerName: [pensioner.firstName, pensioner.lastName1, pensioner.lastName2].filter(Boolean).join(' '),
      openNeeds,
      resolvedNeeds,
      solvedProblems,
      avgResolutionDays,
    };
  }

  private serialize(n: Record<string, unknown>) {
    const pensioner = n.pensioner as {
      id: bigint; uuid: string; firstName: string; lastName1: string; lastName2: string | null;
      knownAs: string | null; identityCard: string;
      province: { name: string } | null; municipality: { name: string } | null;
    } | null;
    const needType = n.needType as { id: bigint; code: string; name: string } | null;
    const electro = n.electrodomesticType as { id: bigint; code: string; name: string } | null;
    const assignedTo = n.assignedTo as { id: string; username: string; fullName: string } | null;

    return {
      id: String(n.uuid ?? ''),
      numericId: Number(n.id),
      pensionerId: Number(n.pensionerId),
      pensionerUuid: pensioner?.uuid ?? null,
      pensionerName: pensioner
        ? [pensioner.firstName, pensioner.lastName1, pensioner.lastName2].filter(Boolean).join(' ')
        : null,
      pensionerIdentityCard: pensioner?.identityCard ?? null,
      pensionerProvince: pensioner?.province?.name ?? null,
      pensionerMunicipality: pensioner?.municipality?.name ?? null,
      needTypeId: Number(n.needTypeId),
      needTypeName: needType?.name ?? null,
      needTypeCode: needType?.code ?? null,
      electrodomesticTypeId: n.electrodomesticTypeId ? Number(n.electrodomesticTypeId) : null,
      electrodomesticTypeName: electro?.name ?? null,
      quantity: Number(n.quantity ?? 1),
      description: String(n.description ?? ''),
      priority: n.priority,
      status: n.status,
      assignedToId: n.assignedToId,
      assignedToName: assignedTo?.fullName ?? null,
      assignedToUsername: assignedTo?.username ?? null,
      identifiedAt: n.identifiedAt instanceof Date ? n.identifiedAt.toISOString().slice(0, 10) : null,
      targetDate: n.targetDate instanceof Date ? n.targetDate.toISOString().slice(0, 10) : null,
      resolvedAt: n.resolvedAt instanceof Date ? n.resolvedAt.toISOString() : null,
      resolutionJustification: n.resolutionJustification,
      solutionType: n.solutionType,
      previousNeedId: n.previousNeedId ? Number(n.previousNeedId) : null,
      version: Number(n.version ?? 1),
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : null,
      updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : null,
    };
  }
}
