/**
 * SAP-ONAC — Seed de base de datos.
 * Carga: roles del sistema, nomencladores iniciales, usuario admin inicial.
 * Ejecutar con: pnpm --filter @sap-onac/backend db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de SAP-ONAC...');

  await seedRoles();
  await seedNomenclators();
  await seedAdminUser();

  console.log('✅ Seed completado.');
}

async function seedRoles() {
  console.log('→ Roles del sistema...');
  const roles = [
    { code: 'ADMIN_ONAC', name: 'Administrador ONAC', description: 'Superusuario nacional con acceso total al sistema', isSystem: true },
    { code: 'OPERADOR_PROVINCIAL', name: 'Operador Provincial', description: 'Acceso limitado a su provincia asignada', isSystem: true },
    { code: 'OPERADOR_MUNICIPAL', name: 'Operador Municipal', description: 'Acceso limitado a su municipio asignado', isSystem: true },
    { code: 'AUDITOR', name: 'Auditor / Consulta', description: 'Acceso de solo lectura a nivel nacional', isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
    console.log(`  ✓ Rol: ${role.code}`);
  }
}

async function seedNomenclators() {
  console.log('→ Nomencladores...');

  // Provincias de Cuba (16 + Municipio Especial)
  const provinces = [
    { code: 'PINAR_DEL_RIO', name: 'Pinar del Río', sortOrder: 1 },
    { code: 'ARTEMISA', name: 'Artemisa', sortOrder: 2 },
    { code: 'LA_HABANA', name: 'La Habana', sortOrder: 3 },
    { code: 'MAYABEQUE', name: 'Mayabeque', sortOrder: 4 },
    { code: 'MATANZAS', name: 'Matanzas', sortOrder: 5 },
    { code: 'CIENFUEGOS', name: 'Cienfuegos', sortOrder: 6 },
    { code: 'VILLA_CLARA', name: 'Villa Clara', sortOrder: 7 },
    { code: 'SANCTI_SPIRITUS', name: 'Sancti Spíritus', sortOrder: 8 },
    { code: 'CIEGO_DE_AVILA', name: 'Ciego de Ávila', sortOrder: 9 },
    { code: 'CAMAGUEY', name: 'Camagüey', sortOrder: 10 },
    { code: 'LAS_TUNAS', name: 'Las Tunas', sortOrder: 11 },
    { code: 'HOLGUIN', name: 'Holguín', sortOrder: 12 },
    { code: 'GRANMA', name: 'Granma', sortOrder: 13 },
    { code: 'SANTIAGO_DE_CUBA', name: 'Santiago de Cuba', sortOrder: 14 },
    { code: 'GUANTANAMO', name: 'Guantánamo', sortOrder: 15 },
    { code: 'ISLA_DE_LA_JUVENTUD', name: 'Municipio Especial Isla de la Juventud', sortOrder: 16 },
  ];

  for (const p of provinces) {
    await prisma.catProvince.upsert({
      where: { code: p.code },
      update: { name: p.name, sortOrder: p.sortOrder },
      create: p,
    });
  }
  console.log(`  ✓ ${provinces.length} provincias cargadas`);

  // Municipios de La Habana
  const habana = await prisma.catProvince.findUnique({ where: { code: 'LA_HABANA' } });
  if (habana) {
    const municipiosHabana = [
      { code: 'ARROYO_NARANJO', name: 'Arroyo Naranjo', sortOrder: 1, provinceId: habana.id },
      { code: 'BOYEROS', name: 'Boyeros', sortOrder: 2, provinceId: habana.id },
      { code: 'CENTRO_HABANA', name: 'Centro Habana', sortOrder: 3, provinceId: habana.id },
      { code: 'CERRO', name: 'Cerro', sortOrder: 4, provinceId: habana.id },
      { code: 'COTORRO', name: 'Cotorro', sortOrder: 5, provinceId: habana.id },
      { code: 'DIEZ_DE_OCTUBRE', name: 'Diez de Octubre', sortOrder: 6, provinceId: habana.id },
      { code: 'GUANABACOA', name: 'Guanabacoa', sortOrder: 7, provinceId: habana.id },
      { code: 'LA_HABANA_DEL_ESTE', name: 'La Habana del Este', sortOrder: 8, provinceId: habana.id },
      { code: 'LA_HABANA_VIEJA', name: 'La Habana Vieja', sortOrder: 9, provinceId: habana.id },
      { code: 'LA_LISA', name: 'La Lisa', sortOrder: 10, provinceId: habana.id },
      { code: 'MARIANAO', name: 'Marianao', sortOrder: 11, provinceId: habana.id },
      { code: 'PLAYA', name: 'Playa', sortOrder: 12, provinceId: habana.id },
      { code: 'PLAZA_DE_LA_REVOLUCION', name: 'Plaza de la Revolución', sortOrder: 13, provinceId: habana.id },
      { code: 'REGLA', name: 'Regla', sortOrder: 14, provinceId: habana.id },
      { code: 'SAN_MIGUEL_DEL_PADRON', name: 'San Miguel del Padrón', sortOrder: 15, provinceId: habana.id },
    ];

    for (const m of municipiosHabana) {
      await prisma.catMunicipality.upsert({
        where: { code: m.code },
        update: { name: m.name, sortOrder: m.sortOrder },
        create: m,
      });
    }
    console.log(`  ✓ ${municipiosHabana.length} municipios de La Habana cargados`);
  }

  // Sexo
  for (const s of [
    { code: 'F', name: 'Femenino', sortOrder: 1 },
    { code: 'M', name: 'Masculino', sortOrder: 2 },
  ]) {
    await prisma.catSex.upsert({
      where: { code: s.code },
      update: { name: s.name, sortOrder: s.sortOrder },
      create: s,
    });
  }
  console.log('  ✓ 2 sexos cargados');

  // Color de piel
  for (const sc of [
    { code: 'AMARILLA', name: 'Amarilla', sortOrder: 1 },
    { code: 'BLANCA', name: 'Blanca', sortOrder: 2 },
    { code: 'MESTIZA', name: 'Mestiza', sortOrder: 3 },
    { code: 'NEGRA', name: 'Negra', sortOrder: 4 },
  ]) {
    await prisma.catSkinColor.upsert({
      where: { code: sc.code },
      update: { name: sc.name, sortOrder: sc.sortOrder },
      create: sc,
    });
  }
  console.log('  ✓ 4 colores de piel cargados');

  // Estado de salud
  for (const h of [
    { code: 'BUENO', name: 'Bueno', sortOrder: 1 },
    { code: 'REGULAR', name: 'Regular', sortOrder: 2 },
    { code: 'MALO', name: 'Malo', sortOrder: 3 },
  ]) {
    await prisma.catHealthStatus.upsert({
      where: { code: h.code },
      update: { name: h.name, sortOrder: h.sortOrder },
      create: h,
    });
  }
  console.log('  ✓ 3 estados de salud cargados');

  // Categorías de pensionados (observación 1 de Sandra Moya)
  for (const c of [
    { code: 'EJERCITO_REBELDE', name: 'Ejército Rebelde', sortOrder: 1 },
    { code: 'LUCHA_CLANDESTINA', name: 'Lucha Clandestina', sortOrder: 2 },
    { code: 'PERSONAS_CON_INVALIDEZ', name: 'Personas con Invalidez', sortOrder: 3 },
    { code: 'MILITARES_PENSIONADOS_FAR', name: 'Militares Pensionados de las FAR', sortOrder: 4 },
    { code: 'MILITARES_PENSIONADOS_SMA', name: 'Militares Pensionados llamados al SMA', sortOrder: 5 },
    { code: 'FAMILIARES_DE_CAIDOS', name: 'Familiares de Caídos', sortOrder: 6 },
    { code: 'CONGO', name: 'Congo', sortOrder: 7 },
  ]) {
    await prisma.catPensionerCategory.upsert({
      where: { code: c.code },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log('  ✓ 7 categorías de pensionados cargadas');

  // Estado civil
  for (const cs of [
    { code: 'SOLTERO', name: 'Soltero(a)', sortOrder: 1 },
    { code: 'CASADO', name: 'Casado(a)', sortOrder: 2 },
    { code: 'DIVORCIADO', name: 'Divorciado(a)', sortOrder: 3 },
    { code: 'VIUDO', name: 'Viudo(a)', sortOrder: 4 },
    { code: 'UNION_CONSENSUAL', name: 'Unión Consensual', sortOrder: 5 },
  ]) {
    await prisma.catCivilStatus.upsert({
      where: { code: cs.code },
      update: { name: cs.name, sortOrder: cs.sortOrder },
      create: cs,
    });
  }
  console.log('  ✓ 5 estados civiles cargados');

  // Tipos de vivienda
  for (const h of [
    { code: 'PROPIA', name: 'Propia', sortOrder: 1 },
    { code: 'ALQUILADA', name: 'Alquilada', sortOrder: 2 },
    { code: 'DE_FAMILIARES', name: 'De familiares', sortOrder: 3 },
    { code: 'OTRA', name: 'Otra', sortOrder: 4 },
  ]) {
    await prisma.catHousingType.upsert({
      where: { code: h.code },
      update: { name: h.name, sortOrder: h.sortOrder },
      create: h,
    });
  }
  console.log('  ✓ 4 tipos de vivienda cargados');

  // Tipos de pensión
  for (const p of [
    { code: 'POR_EDAD', name: 'Por edad', sortOrder: 1 },
    { code: 'POR_INVALIDEZ', name: 'Por invalidez', sortOrder: 2 },
    { code: 'POR_ORFANDAD', name: 'Por orfandad', sortOrder: 3 },
    { code: 'POR_VIUDEDAD', name: 'Por viudedad', sortOrder: 4 },
    { code: 'OTRAS', name: 'Otras', sortOrder: 5 },
  ]) {
    await prisma.catPensionType.upsert({
      where: { code: p.code },
      update: { name: p.name, sortOrder: p.sortOrder },
      create: p,
    });
  }
  console.log('  ✓ 5 tipos de pensión cargados');

  // Tipos de propiedad
  for (const p of [
    { code: 'PROPIETARIO', name: 'Propietario', sortOrder: 1 },
    { code: 'ARRENDATARIO', name: 'Arrendatario', sortOrder: 2 },
    { code: 'OCUPANTE', name: 'Ocupante', sortOrder: 3 },
    { code: 'OTRO', name: 'Otro', sortOrder: 4 },
  ]) {
    await prisma.catPropertyType.upsert({
      where: { code: p.code },
      update: { name: p.name, sortOrder: p.sortOrder },
      create: p,
    });
  }
  console.log('  ✓ 4 tipos de propiedad cargados');

  // Causas de movimiento (altas)
  for (const c of [
    { code: 'ALTA_INICIAL', name: 'Alta inicial', appliesTo: 'alta', sortOrder: 1 },
    { code: 'ALTA_POR_REINGRESO', name: 'Alta por reingreso al sistema', appliesTo: 'alta', sortOrder: 2 },
    { code: 'ALTA_POR_TRASLADO', name: 'Alta por traslado de otra provincia', appliesTo: 'alta', sortOrder: 3 },
    { code: 'ALTA_POR_MAYORIA_EDAD', name: 'Alta por mayoría de edad (familiares de caídos)', appliesTo: 'alta', sortOrder: 4 },
  ]) {
    await prisma.catMovementCause.upsert({
      where: { code: c.code },
      update: { name: c.name, appliesTo: c.appliesTo, sortOrder: c.sortOrder },
      create: c,
    });
  }

  // Causas de movimiento (bajas)
  for (const c of [
    { code: 'BAJA_POR_FALLECIMIENTO', name: 'Baja por fallecimiento', appliesTo: 'baja', sortOrder: 1 },
    { code: 'BAJA_POR_TRASLADO', name: 'Baja por traslado a otra provincia', appliesTo: 'baja', sortOrder: 2 },
    { code: 'BAJA_POR_RENUNCIA', name: 'Baja por renuncia voluntaria', appliesTo: 'baja', sortOrder: 3 },
    { code: 'BAJA_POR_ERROR_REGISTRO', name: 'Baja por error de registro (duplicado)', appliesTo: 'baja', sortOrder: 4 },
  ]) {
    await prisma.catMovementCause.upsert({
      where: { code: c.code },
      update: { name: c.name, appliesTo: c.appliesTo, sortOrder: c.sortOrder },
      create: c,
    });
  }

  // Causas de reincorporación al SMA
  for (const c of [
    { code: 'REINCORP_SMA_VOLUNTARIA', name: 'Reincorporación voluntaria al SMA', appliesTo: 'reincorporacion_sma', sortOrder: 1 },
    { code: 'REINCORP_SMA_MOVILIZACION', name: 'Reincorporación al SMA por movilización', appliesTo: 'reincorporacion_sma', sortOrder: 2 },
  ]) {
    await prisma.catMovementCause.upsert({
      where: { code: c.code },
      update: { name: c.name, appliesTo: c.appliesTo, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log('  ✓ 10 causas de movimiento cargadas (4 altas + 4 bajas + 2 reincorporaciones SMA)');
}

async function seedAdminUser() {
  console.log('→ Usuario administrador inicial...');
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN_ONAC' } });
  if (!adminRole) throw new Error('Rol ADMIN_ONAC no encontrado');

  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin.onac' } });
  if (existingAdmin) {
    console.log('  ✓ Usuario admin.onac ya existe, se omite');
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMe!2026', 12);
  const user = await prisma.user.create({
    data: {
      uuid: crypto.randomUUID(),
      username: 'admin.onac',
      email: 'admin@onac.cu',
      passwordHash,
      fullName: 'Administrador ONAC',
      position: 'Administrador del Sistema',
      forcePasswordChange: true,
      passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      userRoles: {
        create: {
          roleId: adminRole.id,
          isActive: true,
        },
      },
    },
  });

  console.log(`  ✓ Usuario admin.onac creado (id=${user.id})`);
  console.log('  ⚠️  Contraseña inicial: ChangeMe!2026 (CAMBIAR EN PRIMER LOGIN)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
