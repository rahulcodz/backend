import { Module } from '@nestjs/common';
import { BrowseService } from './browse.service';
import { BrowseController } from './browse.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrowseController],
  providers: [BrowseService],
})
export class BrowseModule {}
