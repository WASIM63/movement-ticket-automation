import { Module } from '@nestjs/common';
import { SapIntegrationController } from './sap-integration.controller';
import { SapIntegrationService } from './sap-integration.service';
@Module({ controllers: [SapIntegrationController], providers: [SapIntegrationService], exports: [SapIntegrationService] })
export class SapIntegrationModule {}
