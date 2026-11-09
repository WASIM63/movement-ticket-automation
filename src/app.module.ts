import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { MovementTicketsModule } from './movement-tickets/movement-tickets.module';
import { MasterDataModule } from './master-data/master-data.module';
import { SapIntegrationModule } from './sap-integration/sap-integration.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule, MasterDataModule, MovementTicketsModule, SapIntegrationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
