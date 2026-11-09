import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { SapIntegrationService } from './sap-integration.service';
@Controller('api/sap')
export class SapIntegrationController {
  constructor(private readonly sap: SapIntegrationService) {}
  @Get('status') status() { return this.sap.status(); }
  @Get('billing/:billingDocument/pdf')
  async billingPdf(@Param('billingDocument') id: string, @Res() res: Response) {
    const pdf = await this.sap.readBillingPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    return res.send(pdf);
  }
}
