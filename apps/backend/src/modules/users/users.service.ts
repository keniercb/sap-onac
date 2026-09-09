import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role.code),
      territories: user.userTerritories.map((t) => ({
        roleCode: t.role.code,
        provinceId: t.provinceId,
        municipalityId: t.municipalityId,
      })),
    };
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
    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role.code),
      territories: user.userTerritories.map((t) => ({
        roleCode: t.role.code,
        provinceId: t.provinceId,
        municipalityId: t.municipalityId,
      })),
    };
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

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }
}
