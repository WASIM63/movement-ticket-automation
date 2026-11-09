import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../database/prisma.service';

@Controller()
export class MasterDataController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('master-data')
  async page(@Res() res: Response) {
    const [plants, vehicles, parts] = await Promise.all([
      this.prisma.plant.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.vehicle.findMany({ orderBy: { registration: 'asc' } }),
      this.prisma.part.findMany({ orderBy: { partName: 'asc' }, take: 500 }),
    ]);
    return res.render('movement/master-data', { layout: 'layouts/movement', title: 'Master Data', plants, vehicles, parts });
  }

  @Get('api/master-data')
  async all() {
    const [plants, vehicles, parts] = await Promise.all([
      this.prisma.plant.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
      this.prisma.vehicle.findMany({ where: { active: true }, orderBy: { registration: 'asc' } }),
      this.prisma.part.findMany({ where: { active: true }, orderBy: { partName: 'asc' } }),
    ]);
    return { plants, vehicles, parts };
  }

  @Post('api/master-data/plants')
  async addPlant(@Body() b: any) {
    return this.prisma.plant.create({ data: { code: String(b.code).trim(), name: String(b.name).trim() } });
  }
  @Post('api/master-data/vehicles')
  async addVehicle(@Body() b: any) {
    return this.prisma.vehicle.create({ data: { registration: String(b.registration).trim().toUpperCase(), description: b.description || null } });
  }
  @Post('api/master-data/parts')
  async addPart(@Body() b: any) {
    return this.prisma.part.create({ data: {
      productCode: String(b.productCode).trim(), partName: String(b.partName).trim(),
      customerReference: b.customerReference || null, salesOrder: b.salesOrder || null,
      subM: b.subM || null, unit: b.unit || 'EA',
    } });
  }
}
