import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async home(@Res() res: Response) {
    const [tickets, draft, completed] = await Promise.all([
      this.prisma.movementTicket.count(),
      this.prisma.movementTicket.count({ where: { status: 'DRAFT' } }),
      this.prisma.movementTicket.count({ where: { status: 'SAP_COMPLETED' } }),
    ]);
    return res.render('movement/dashboard', { layout: 'layouts/movement', title: 'Movement Tickets', stats: { tickets, draft, completed } });
  }
}
