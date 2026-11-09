import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SapIntegrationService } from './sap-integration.service';

@Controller('api/sap')
export class SapIntegrationController {
  constructor(private readonly sap: SapIntegrationService) {}

  @Get('status')
  status() {
    return this.sap.status();
  }

  @Get('sandbox/status')
  sandboxStatus() {
    return this.sap.status().sandbox;
  }

  @Get('sandbox/sales-orders')
  salesOrders(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxSalesOrders(Number.isFinite(parsed) ? parsed : 10);
  }

  @Get('sandbox/sales-orders/:salesOrder')
  salesOrder(@Param('salesOrder') salesOrder: string) {
    return this.sap.readSandboxSalesOrder(salesOrder);
  }
}
