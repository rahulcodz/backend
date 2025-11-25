import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminOrdersController } from './orders.controller';
import { AdminOrdersService } from './orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminModule {}
