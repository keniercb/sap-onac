import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface CreateUserInput {
  username: string;
  email?: string;
  password: string;
  fullName: string;
  position?: string;
  roleCodes: string[];
  territories: Array<{
    roleCode: string;
    provinceId?: number;
    municipalityId?: number;
  }>;
}

export interface UpdateUserInput {
  email?: string;
  fullName?: string;
  position?: string;
  isActive?: boolean;
  roleCodes?: string[];
  territories?: Array<{
    roleCode: string;
    provinceId?: number;
    municipalityId?: number;
  }>;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findMany(options: { search?: string; onlyActive?: boolean } = {}) {
    const where: Record<string, unknown> = {};
    if (options.onlyActive !== false) where.isActive = true;
    if (options.search) {
      where.OR = [
        { username: { contains: options.search } },
        { fullName: { contains: options.search } },
        { email: { contains: options.search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
        userTerritories: {
          include: { role: true, province: true, municipality: true },
        },
      },
    });

    return users.map(this.serializeUser);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
        userTerritories: {
          include: { role: true, province: true, municipality: true },
        },
      },
    });
    if (!user) return null;
    return this.serializeUserWithSecrets(user);
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
        userTerritories: {
          include: { role: true, province: true, municipality: true },
        },
      },
    });
    if (!user) return null;
    return this.serializeUserWithSecrets(user);
  }

  async create(input: CreateUserInput) {
    // Validar username único
    const existing = await this.prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un usuario con username '${input.username}'`);
    }
    if (input.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new ConflictException(`Ya existe un usuario con email '${input.email}'`);
      }
    }

    // Validar que los roles existen
    const roles = await this.prisma.role.findMany({
      where: { code: { in: input.roleCodes } },
    });
    if (roles.length !== input.roleCodes.length) {
      throw new BadRequestException('Uno o más roles no existen');
    }

    // Validar territorios
    await this.validateTerritories(input.territories);

    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(input.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        username: input.username,
        email: input.email ?? null,
        passwordHash,
        fullName: input.fullName,
        position: input.position ?? null,
        forcePasswordChange: true,
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        userRoles: {
          create: roles.map((role) => ({
            roleId: role.id,
            isActive: true,
          })),
        },
        userTerritories: {
          create: await this.buildTerritoriesCreate(input.territories, roles),
        },
      },
      include: {
        userRoles: { include: { role: true } },
        userTerritories: { include: { role: true, province: true, municipality: true } },
      },
    });

    return this.serializeUser(user);
  }

  async update(id: string, input: UpdateUserInput) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    const data: Record<string, unknown> = {};
    if (input.email !== undefined) data.email = input.email;
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.position !== undefined) data.position = input.position;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    // Si se actualizan roles, reemplazar
    if (input.roleCodes) {
      const roles = await this.prisma.role.findMany({
        where: { code: { in: input.roleCodes } },
      });
      if (roles.length !== input.roleCodes.length) {
        throw new BadRequestException('Uno o más roles no existen');
      }
      // Desactivar userRoles anteriores
      await this.prisma.userRole.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false },
      });
      // Crear nuevos
      for (const role of roles) {
        const existingUR = await this.prisma.userRole.findUnique({
          where: { userId_roleId: { userId: id, roleId: role.id } },
        });
        if (existingUR) {
          await this.prisma.userRole.update({
            where: { id: existingUR.id },
            data: { isActive: true },
          });
        } else {
          await this.prisma.userRole.create({
            data: { userId: id, roleId: role.id, isActive: true },
          });
        }
      }
    }

    // Si se actualizan territorios, reemplazar
    if (input.territories) {
      await this.validateTerritories(input.territories);
      await this.prisma.userTerritory.deleteMany({ where: { userId: id } });
      const roles = await this.prisma.role.findMany();
      await this.prisma.userTerritory.createMany({
        data: await this.buildTerritoriesCreate(input.territories, roles, id),
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: { where: { isActive: true }, include: { role: true } },
        userTerritories: { include: { role: true, province: true, municipality: true } },
      },
    });

    return this.serializeUser(updated);
  }

  async updatePassword(userId: string, passwordHash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        forcePasswordChange: false,
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async resetPassword(id: string, newPassword: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    const rounds = this.config.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(newPassword, rounds);
    await this.updatePassword(id, passwordHash);
    return { success: true };
  }

  async deactivate(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async listRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });
  }

  // ===== Helpers =====

  private async validateTerritories(
    territories: Array<{
      roleCode: string;
      provinceId?: number;
      municipalityId?: number;
    }>,
  ) {
    for (const t of territories) {
      if (t.roleCode === 'ADMIN_ONAC' || t.roleCode === 'AUDITOR') {
        if (t.provinceId || t.municipalityId) {
          throw new BadRequestException(
            `Rol ${t.roleCode} no puede tener territorio asignado (es nacional)`,
          );
        }
      } else if (t.roleCode === 'OPERADOR_PROVINCIAL') {
        if (!t.provinceId) {
          throw new BadRequestException(
            `Rol OPERADOR_PROVINCIAL requiere provinceId`,
          );
        }
      } else if (t.roleCode === 'OPERADOR_MUNICIPAL') {
        if (!t.provinceId || !t.municipalityId) {
          throw new BadRequestException(
            `Rol OPERADOR_MUNICIPAL requiere provinceId y municipalityId`,
          );
        }
      }
      // Validar municipio-provincia coherente
      if (t.provinceId && t.municipalityId) {
        const mun = await this.prisma.catMunicipality.findUnique({
          where: { id: BigInt(t.municipalityId) },
        });
        if (!mun || mun.provinceId !== BigInt(t.provinceId)) {
          throw new BadRequestException(
            `El municipio ${t.municipalityId} no pertenece a la provincia ${t.provinceId}`,
          );
        }
      }
    }
  }

  private async buildTerritoriesCreate(
    territories: Array<{
      roleCode: string;
      provinceId?: number;
      municipalityId?: number;
    }>,
    roles: Array<{ id: bigint; code: string }>,
    userId?: string,
  ): Promise<Array<{ userId: string; roleId: bigint; provinceId: bigint | null; municipalityId: bigint | null }>> {
    const result: Array<{ userId: string; roleId: bigint; provinceId: bigint | null; municipalityId: bigint | null }> = [];
    for (const t of territories) {
      const role = roles.find((r) => r.code === t.roleCode);
      if (!role) continue;
      result.push({
        userId: userId ?? '',
        roleId: role.id,
        provinceId: t.provinceId ? BigInt(t.provinceId) : null,
        municipalityId: t.municipalityId ? BigInt(t.municipalityId) : null,
      });
    }
    return result;
  }

  private serializeUser(user: Record<string, unknown>) {
    return {
      id: user.uuid,
      numericId: String(user.id),
      username: user.username,
      email: user.email ?? null,
      fullName: user.fullName,
      position: user.position ?? null,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      forcePasswordChange: user.forcePasswordChange,
      lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : null,
      roles: (user.userRoles as Array<{ role: { code: string; name: string } }>)?.map((ur) => ({
        code: ur.role.code,
        name: ur.role.name,
      })) ?? [],
      territories: (user.userTerritories as Array<{ role: { code: string; name: string }; province: { id: bigint; name: string } | null; municipality: { id: bigint; name: string } | null }>)?.map((t) => ({
        roleCode: t.role.code,
        roleName: t.role.name,
        provinceId: t.province ? Number(t.province.id) : null,
        provinceName: t.province?.name ?? null,
        municipalityId: t.municipality ? Number(t.municipality.id) : null,
        municipalityName: t.municipality?.name ?? null,
      })) ?? [],
    };
  }

  private serializeUserWithSecrets(user: Record<string, unknown>) {
    return {
      ...this.serializeUser(user),
      passwordHash: user.passwordHash as string,
      twoFactorSecret: user.twoFactorSecret as string | null,
      failedLoginAttempts: user.failedLoginAttempts as number,
      lockedAt: user.lockedAt instanceof Date ? user.lockedAt.toISOString() : null,
      passwordExpiresAt: user.passwordExpiresAt instanceof Date ? user.passwordExpiresAt.toISOString() : null,
      // Campos adicionales que espera AuthService (tipos primitivos para evitar fricción)
      id: String(user.id),
      isActive: Boolean(user.isActive),
      roleCodes: (user.userRoles as Array<{ role: { code: string; name: string } }>)?.map((ur) => ur.role.code) ?? [],
      territoryCodes: (user.userTerritories as Array<{ role: { code: string } }>)?.map((t) => t.role.code) ?? [],
    };
  }
}
