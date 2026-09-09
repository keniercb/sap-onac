import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

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
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('❌ Variables de entorno inválidas:', errors);
    throw new Error('Validación de variables de entorno fallida');
  }
  return validated;
}

export type ValidatedEnv = EnvironmentVariables;
