import { Module } from '@nestjs/common';
import { SolvedProblemsController } from './solved-problems.controller';
import { SolvedProblemsService } from './solved-problems.service';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SolvedProblemsService],
  controllers: [SolvedProblemsController],
  exports: [SolvedProblemsService],
})
export class SolvedProblemsModule {}
