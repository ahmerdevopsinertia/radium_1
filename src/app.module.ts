import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeliveryModule } from './delivery/delivery.module';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [DeliveryModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
