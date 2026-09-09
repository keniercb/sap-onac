import { Module } from '@nestjs/common';
import { PensionersController } from './pensioners.controller';
import { PensionersService } from './pensioners.service';
import { PrismaModule } from '@common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PensionersService],
  controllers: [PensionersController],
  exports: [PensionersService],
})
export class PensionersModule {}
