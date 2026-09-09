import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { validateEnv } from '@config/env.validation';
import { pinoLoggerFactory } from '@config/pino.config';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RedisModule } from '@common/redis/redis.module';
import { TerritoryInterceptor } from '@common/interceptors/territory.interceptor';
import { AuditModule } from '@modules/audit/audit.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { PensionersModule } from '@modules/pensioners/pensioners.module';
import { CatalogsModule } from '@modules/catalogs/catalogs.module';
import { MovementsModule } from '@modules/movements/movements.module';
import { NeedsModule } from '@modules/needs/needs.module';
import { SolvedProblemsModule } from '@modules/solved-problems/solved-problems.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({ useFactory: pinoLoggerFactory }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 },
      { ttl: 60_000, limit: 10, name: 'auth' },
    ]),
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    UsersModule,
    PensionersModule,
    CatalogsModule,
    MovementsModule,
    NeedsModule,
    SolvedProblemsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TerritoryInterceptor,
    },
  ],
})
export class AppModule {}
