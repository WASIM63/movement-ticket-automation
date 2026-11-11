import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
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

  @Get('sandbox/outbound-deliveries')
  outboundDeliveries(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxOutboundDeliveries(Number.isFinite(parsed) ? parsed : 10);
  }

  @Get('sandbox/billing-documents/v4')
  billingDocumentsV4(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxBillingDocumentsV4(Number.isFinite(parsed) ? parsed : 10);
  }

  @Get('sandbox/billing-documents/v2')
  billingDocumentsV2(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxBillingDocumentsV2(Number.isFinite(parsed) ? parsed : 10);
  }

  @Get('sandbox/electronic-document-files')
  electronicDocumentFiles(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxElectronicDocumentFiles(Number.isFinite(parsed) ? parsed : 10);
  }

  @Get('sandbox/attachments')
  attachments(@Query('top') top?: string) {
    const parsed = top === undefined ? 10 : Number(top);
    return this.sap.readSandboxAttachments(Number.isFinite(parsed) ? parsed : 10);
  }

  @Post('sandbox/operations/:operation')
  executePost(@Param('operation') operation: string, @Body() body: unknown) {
    return this.sap.executeConfiguredSandboxOperation(operation, 'POST', body);
  }

  @Patch('sandbox/operations/:operation')
  executePatch(@Param('operation') operation: string, @Body() body: unknown) {
    return this.sap.executeConfiguredSandboxOperation(operation, 'PATCH', body);
  }
}
