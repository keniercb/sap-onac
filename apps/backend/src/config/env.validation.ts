import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Max,
  Min,
  validateSync,
  type ValidationError,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber() @Min(1) @Max(65535)
  PORT = 4000;

  @IsString()
  API_PREFIX = 'api';

  @IsString()
  CORS_ORIGINS!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_HOST!: string;

  @IsNumber() @Min(1) @Max(65535)
  REDIS_PORT!: number;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRATION!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_EXPIRATION!: string;

  @IsString()
  TWOFA_ISSUER!: string;

  @IsNumber() @Min(4)
  BCRYPT_ROUNDS = 12;

  @IsNumber() @Min(1)
  LOCKOUT_MAX_ATTEMPTS = 5;

  @IsNumber() @Min(1)
  LOCKOUT_DURATION_MINUTES = 15;

  @IsNumber() @Min(1)
  PASSWORD_EXPIRATION_DAYS = 90;

  @IsOptional() @IsString()
  UPLOAD_DIR?: string;

  @IsOptional() @IsString()
  LOG_LEVEL?: string;
}

/**
 * Lista de variables obligatorias (sin valor por defecto en la clase).
 * Sirve para mostrar un mensaje claro cuando falta alguna.
 */
const REQUIRED_VARS = [
  'CORS_ORIGINS',
  'DATABASE_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRATION',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRATION',
  'TWOFA_ISSUER',
];

export function validateEnv(config: Record<string, unknown>) {
  // 0. Pre-procesar: convertir strings numéricos a numbers (las env vars llegan como string)
  const numericKeys = ['PORT', 'REDIS_PORT', 'BCRYPT_ROUNDS', 'LOCKOUT_MAX_ATTEMPTS', 'LOCKOUT_DURATION_MINUTES', 'PASSWORD_EXPIRATION_DAYS'];
  const processedConfig: Record<string, unknown> = { ...config };
  for (const key of numericKeys) {
    if (processedConfig[key] !== undefined && processedConfig[key] !== null && processedConfig[key] !== '') {
      const num = Number(processedConfig[key]);
      if (!Number.isNaN(num)) {
        processedConfig[key] = num;
      }
    }
  }

  // 1. Verificar variables obligatorias faltantes
  const missing = REQUIRED_VARS.filter((key) => {
    const value = processedConfig[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    const msg = [
      '',
      '════════════════════════════════════════════════════════════════',
      '  ❌ FALTAN VARIABLES DE ENTORNO OBLIGATORIAS',
      '════════════════════════════════════════════════════════════════',
      '',
      `  Variables faltantes: ${missing.join(', ')}`,
      '',
      '  SOLUCIÓN:',
      '  1. Asegúrate de tener el archivo apps/backend/.env',
      '  2. Si no existe, cópialo desde .env.example:',
      '     copy apps/backend/.env.example apps/backend/.env',
      '  3. Edita los valores según tu entorno (MySQL, Redis, JWT secrets)',
      '',
      '  Variables obligatorias:',
      ...REQUIRED_VARS.map((v) => `    - ${v}`),
      '',
      '════════════════════════════════════════════════════════════════',
      '',
    ].join('\n');
    // eslint-disable-next-line no-console
    console.error(msg);
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  // 2. Validar tipos con class-validator
  const validated = plainToInstance(EnvironmentVariables, processedConfig, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((err: ValidationError) => formatError(err))
      .join('\n');

    const msg = [
      '',
      '════════════════════════════════════════════════════════════════',
      '  ❌ VARIABLES DE ENTORNO CON VALORES INVÁLIDOS',
      '════════════════════════════════════════════════════════════════',
      '',
      details,
      '',
      '  SOLUCIÓN: revisa apps/backend/.env y corrige los valores',
      '════════════════════════════════════════════════════════════════',
      '',
    ].join('\n');
    // eslint-disable-next-line no-console
    console.error(msg);
    throw new Error('Validación de variables de entorno fallida');
  }
  return validated;
}

function formatError(err: ValidationError, prefix = ''): string {
  const property = prefix ? `${prefix}.${err.property}` : err.property;
  let result = `  • ${property}: ${err.value ?? 'undefined'}`;

  if (err.constraints) {
    const messages = Object.values(err.constraints);
    result += `\n    → ${messages.join('; ')}`;
  }

  if (err.children && err.children.length > 0) {
    for (const child of err.children) {
      result += '\n' + formatError(child, property);
    }
  }

  return result;
}

export type ValidatedEnv = EnvironmentVariables;
