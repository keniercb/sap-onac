import { Module } from '@nestjs/common';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NeedsService],
  controllers: [NeedsController],
  exports: [NeedsService],
})
export class NeedsModule {}
