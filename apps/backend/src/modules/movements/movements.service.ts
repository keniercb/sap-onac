import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';
import { PrismaService } from '@common/prisma/prisma.service';

export interface CreateMovementInput {
  pensionerId: number;
  movementType: 'alta' | 'baja' | 'reincorporacion_sma';
  movementDate: string;
  causeId?: number;
  causeDescription?: string;
  agreementNumber?: string;
  agreementDate?: string;
  notes?: string;
}

export interface MovementQuery {
  pensionerId?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class MovementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista los movimientos con filtros opcionales.
   */
  async findMany(params: MovementQuery = {}) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(params.pageSize ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const where: Prisma.MovementWhereInput = {};
    if (params.pensionerId) where.pensionerId = BigInt(params.pensionerId);
    if (params.movementType) {
      where.movementType = params.movementType as MovementType;
    }
    if (params.startDate || params.endDate) {
      where.movementDate = {};
      if (params.startDate) (where.movementDate as Prisma.DateTimeFilter).gte = new Date(params.startDate);
      if (params.endDate) (where.movementDate as Prisma.DateTimeFilter).lte = new Date(params.endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.movement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { movementDate: 'desc' },
        include: {
          cause: true,
          pensioner: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName1: true,
              lastName2: true,
              knownAs: true,
              identityCard: true,
              currentState: true,
            },
          },
        },
      }),
      this.prisma.movement.count({ where }),
    ]);

    return {
      items: items.map((m) => this.serialize(m)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Lista los movimientos de un pensionado específico, ordenados por fecha descendente.
   */
  async findByPensioner(pensionerId: number) {
    const items = await this.prisma.movement.findMany({
      where: { pensionerId: BigInt(pensionerId) },
      orderBy: { movementDate: 'desc' },
      include: { cause: true },
    });
    return items.map((m) => this.serialize(m));
  }

  /**
   * Crea un nuevo movimiento y recalcula el estado actual del pensionado.
   */
  async create(input: CreateMovementInput) {
    const pensionerId = BigInt(input.pensionerId);
    const pensioner = await this.prisma.pensioner.findUnique({
      where: { id: pensionerId },
    });
    if (!pensioner || pensioner.deletedAt) {
      throw new NotFoundException(`Pensionado ${input.pensionerId} no encontrado`);
    }

    // Validar alternancia: no permitir dos 'baja' consecutivas sin 'alta' intermedia (RN-12)
    if (input.movementType === 'baja') {
      const lastMovement = await this.prisma.movement.findFirst({
        where: { pensionerId },
        orderBy: { movementDate: 'desc' },
      });
      if (lastMovement && lastMovement.movementType === 'baja') {
        throw new ConflictException(
          `No se puede registrar una baja: ya existe una baja posterior a la última alta (regla RN-12)`,
        );
      }
    }

    // Validar causa coherente con el tipo de movimiento
    if (input.causeId) {
      const cause = await this.prisma.catMovementCause.findUnique({
        where: { id: BigInt(input.causeId) },
      });
      if (!cause) {
        throw new BadRequestException(`Causa ${input.causeId} no encontrada`);
      }
      if (cause.appliesTo !== input.movementType) {
        throw new BadRequestException(
          `La causa '${cause.name}' aplica a '${cause.appliesTo}', no a '${input.movementType}'`,
        );
      }
    }

    const movement = await this.prisma.movement.create({
      data: {
        uuid: crypto.randomUUID(),
        pensionerId,
        movementType: input.movementType as MovementType,
        movementDate: new Date(input.movementDate),
        causeId: input.causeId ? BigInt(input.causeId) : null,
        causeDescription: input.causeDescription ?? null,
        agreementNumber: input.agreementNumber ?? null,
        agreementDate: input.agreementDate ? new Date(input.agreementDate) : null,
        notes: input.notes ?? null,
      },
      include: { cause: true },
    });

    // Recalcular el estado del pensionado
    const newState = await this.computePensionerState(pensionerId);
    if (newState !== pensioner.currentState) {
      await this.prisma.pensioner.update({
        where: { id: pensionerId },
        data: { currentState: newState as Prisma.PensionerUpdateInput['currentState'] },
      });
    }

    return this.serialize(movement);
  }

  /**
   * Elimina un movimiento (solo admin, solo si es el último).
   */
  async remove(id: number) {
    const movement = await this.prisma.movement.findUnique({
      where: { id: BigInt(id) },
    });
    if (!movement) {
      throw new NotFoundException(`Movimiento ${id} no encontrado`);
    }

    // Verificar que sea el último movimiento del pensionado
    const lastMovement = await this.prisma.movement.findFirst({
      where: { pensionerId: movement.pensionerId },
      orderBy: { movementDate: 'desc' },
    });
    if (lastMovement?.id !== movement.id) {
      throw new BadRequestException(
        `Solo se puede eliminar el último movimiento registrado`,
      );
    }

    await this.prisma.movement.delete({ where: { id: BigInt(id) } });

    // Recalcular estado del pensionado
    const newState = await this.computePensionerState(movement.pensionerId);
    await this.prisma.pensioner.update({
      where: { id: movement.pensionerId },
      data: { currentState: newState as Prisma.PensionerUpdateInput['currentState'] },
    });

    return { success: true };
  }

  /**
   * Calcula el estado actual del pensionado a partir del último movimiento registrado.
   * RN-03:
   *   - Si existe fallecimiento → 'deceased'
   *   - Si la última baja es posterior a la última alta → 'inactive'
   *   - Si existe reincorporación SMA posterior a la última baja → 'reincorporated_sma'
   *   - En caso contrario → 'active'
   */
  private async computePensionerState(
    pensionerId: bigint,
  ): Promise<'active' | 'inactive' | 'deceased' | 'reincorporated_sma'> {
    // Verificar fallecimiento
    const deathRecord = await this.prisma.deathRecord.findUnique({
      where: { pensionerId },
    });
    if (deathRecord) return 'deceased';

    const movements = await this.prisma.movement.findMany({
      where: { pensionerId },
      orderBy: { movementDate: 'desc' },
    });

    if (movements.length === 0) return 'active';

    const last = movements[0];
    if (last.movementType === 'baja') return 'inactive';
    if (last.movementType === 'reincorporacion_sma') return 'reincorporated_sma';
    return 'active';
  }

  /**
   * Lista las causas de movimiento por tipo (alta, baja, reincorporacion_sma).
   */
  async listCauses(appliesTo?: string) {
    const where: Prisma.CatMovementCauseWhereInput = { isActive: true };
    if (appliesTo) where.appliesTo = appliesTo;
    return this.prisma.catMovementCause.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  private serialize(m: {
    id: bigint;
    uuid: string;
    pensionerId: bigint;
    movementType: MovementType;
    movementDate: Date;
    causeId: bigint | null;
    causeDescription: string | null;
    agreementNumber: string | null;
    agreementDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    cause?: { id: bigint; code: string; name: string } | null;
    pensioner?: {
      id: bigint;
      uuid: string;
      firstName: string;
      lastName1: string;
      lastName2: string | null;
      knownAs: string | null;
      identityCard: string;
      currentState: string;
    } | null;
  }) {
    return {
      id: m.uuid,
      numericId: Number(m.id),
      pensionerId: Number(m.pensionerId),
      pensionerUuid: m.pensioner?.uuid ?? null,
      pensionerName: m.pensioner
        ? [m.pensioner.firstName, m.pensioner.lastName1, m.pensioner.lastName2]
            .filter(Boolean)
            .join(' ')
        : null,
      pensionerIdentityCard: m.pensioner?.identityCard ?? null,
      pensionerCurrentState: m.pensioner?.currentState ?? null,
      movementType: m.movementType,
      movementDate: m.movementDate.toISOString().slice(0, 10),
      causeId: m.causeId ? Number(m.causeId) : null,
      causeName: m.cause?.name ?? null,
      causeCode: m.cause?.code ?? null,
      causeDescription: m.causeDescription,
      agreementNumber: m.agreementNumber,
      agreementDate: m.agreementDate ? m.agreementDate.toISOString().slice(0, 10) : null,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
