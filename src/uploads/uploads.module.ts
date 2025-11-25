import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ConfigModule, ThrottlerModule.forRoot({
    throttlers: [
      {
        ttl: 60,
        limit: 2,
      },
    ],
  })],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
