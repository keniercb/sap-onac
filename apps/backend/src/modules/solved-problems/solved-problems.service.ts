import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

export interface CreateSolvedProblemInput {
  pensionerId: number;
  description: string;
  solutionType?: string;
  resolutionDate: string;
  responsibleId?: string;
  notes?: string;
}

export interface UpdateSolvedProblemInput {
  description?: string;
  solutionType?: string;
  resolutionDate?: string;
  responsibleId?: string | null;
  notes?: string;
}

export interface SolvedProblemQuery {
  pensionerId?: number;
  responsibleId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class SolvedProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: SolvedProblemQuery = {}) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(params.pageSize ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params.pensionerId) where.pensionerId = BigInt(params.pensionerId);
    if (params.responsibleId) where.responsibleId = params.responsibleId;
    if (params.startDate || params.endDate) {
      where.resolutionDate = {};
      if (params.startDate) (where.resolutionDate as Record<string, unknown>).gte = new Date(params.startDate);
      if (params.endDate) (where.resolutionDate as Record<string, unknown>).lte = new Date(params.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.solvedProblem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { resolutionDate: 'desc' },
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
            },
          },
          responsible: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.solvedProblem.count({ where }),
    ]);

    return {
      items: items.map((p) => this.serialize(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByPensioner(pensionerId: number) {
    const items = await this.prisma.solvedProblem.findMany({
      where: { pensionerId: BigInt(pensionerId) },
      orderBy: { resolutionDate: 'desc' },
      include: {
        responsible: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    return items.map((p) => this.serialize(p));
  }

  async findById(id: number) {
    const item = await this.prisma.solvedProblem.findUnique({
      where: { id: BigInt(id) },
      include: {
        pensioner: {
          select: {
            id: true, uuid: true, firstName: true, lastName1: true, lastName2: true,
            knownAs: true, identityCard: true,
          },
        },
        responsible: { select: { id: true, username: true, fullName: true } },
      },
    });
    if (!item) {
      throw new NotFoundException(`Problema resuelto ${id} no encontrado`);
    }
    return this.serialize(item);
  }

  async create(input: CreateSolvedProblemInput) {
    const pensioner = await this.prisma.pensioner.findUnique({
      where: { id: BigInt(input.pensionerId) },
    });
    if (!pensioner || pensioner.deletedAt) {
      throw new NotFoundException(`Pensionado ${input.pensionerId} no encontrado`);
    }

    if (input.responsibleId) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.responsibleId },
      });
      if (!user || !user.isActive) {
        throw new BadRequestException(`Usuario responsable inválido o inactivo`);
      }
    }

    const problem = await this.prisma.solvedProblem.create({
      data: {
        uuid: crypto.randomUUID(),
        pensionerId: BigInt(input.pensionerId),
        description: input.description,
        solutionType: input.solutionType ?? null,
        resolutionDate: new Date(input.resolutionDate),
        responsibleId: input.responsibleId ?? null,
        notes: input.notes ?? null,
      },
      include: {
        responsible: { select: { id: true, username: true, fullName: true } },
      },
    });

    return this.serialize(problem);
  }

  async update(id: number, input: UpdateSolvedProblemInput) {
    const existing = await this.prisma.solvedProblem.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Problema resuelto ${id} no encontrado`);
    }

    const data: Record<string, unknown> = {};
    if (input.description !== undefined) data.description = input.description;
    if (input.solutionType !== undefined) data.solutionType = input.solutionType;
    if (input.resolutionDate !== undefined) data.resolutionDate = new Date(input.resolutionDate);
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.responsibleId !== undefined) {
      if (input.responsibleId) {
        const user = await this.prisma.user.findUnique({
          where: { id: input.responsibleId },
        });
        if (!user || !user.isActive) {
          throw new BadRequestException(`Usuario responsable inválido o inactivo`);
        }
      }
      data.responsibleId = input.responsibleId;
    }

    const updated = await this.prisma.solvedProblem.update({
      where: { id: BigInt(id) },
      data,
      include: {
        responsible: { select: { id: true, username: true, fullName: true } },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: number) {
    const existing = await this.prisma.solvedProblem.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Problema resuelto ${id} no encontrado`);
    }
    await this.prisma.solvedProblem.delete({ where: { id: BigInt(id) } });
    return { success: true };
  }

  private serialize(p: Record<string, unknown>) {
    const pensioner = p.pensioner as {
      id: bigint; uuid: string; firstName: string; lastName1: string;
      lastName2: string | null; knownAs: string | null; identityCard: string;
    } | null;
    const responsible = p.responsible as { id: string; username: string; fullName: string } | null;

    return {
      id: String(p.uuid ?? ''),
      numericId: Number(p.id),
      pensionerId: Number(p.pensionerId),
      pensionerUuid: pensioner?.uuid ?? null,
      pensionerName: pensioner
        ? [pensioner.firstName, pensioner.lastName1, pensioner.lastName2].filter(Boolean).join(' ')
        : null,
      pensionerIdentityCard: pensioner?.identityCard ?? null,
      description: String(p.description ?? ''),
      solutionType: p.solutionType,
      resolutionDate: p.resolutionDate instanceof Date ? p.resolutionDate.toISOString().slice(0, 10) : null,
      responsibleId: p.responsibleId,
      responsibleName: responsible?.fullName ?? null,
      responsibleUsername: responsible?.username ?? null,
      notes: p.notes,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : null,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : null,
    };
  }
}
