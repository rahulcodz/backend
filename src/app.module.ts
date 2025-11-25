import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { validate } from './config/env.validation';
import { ProductsModule } from './products/products.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { BrowseModule } from './browse/browse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    EmailModule,
    UploadsModule,
    OrdersModule,
    AdminModule,
    BrowseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
