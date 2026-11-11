import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { MovementTicketsService } from './movement-tickets.service';
import { PrismaService } from '../database/prisma.service';

@Controller()
export class MovementTicketsController {
  constructor(private readonly tickets: MovementTicketsService, private readonly prisma: PrismaService) {}

  @Get('movement-tickets')
  async page(@Res() res: Response) {
    const tickets = await this.tickets.list();
    return res.render('movement/list', { layout: 'layouts/movement', title: 'Movement Tickets', tickets });
  }

  @Get('movement-tickets/new')
  async createPage(@Res() res: Response) {
    const [plants, vehicles, parts] = await Promise.all([
      this.prisma.plant.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
      this.prisma.vehicle.findMany({ where: { active: true }, orderBy: { registration: 'asc' } }),
      this.prisma.part.findMany({ where: { active: true }, orderBy: { partName: 'asc' } }),
    ]);
    return res.render('movement/create', { layout: 'layouts/movement', title: 'Create Movement Ticket', plants, vehicles, parts });
  }

  @Post('api/movement-tickets')
  async create(@Body() body: any) { return this.tickets.create(body); }

  @Get('api/movement-tickets')
  async listApi() { return this.tickets.list(); }

  @Get('api/movement-tickets/:id')
  async getApi(@Param('id', ParseIntPipe) id: number) { return this.tickets.get(id); }

  @Get('movement-tickets/:id/workflow')
  async workflow(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const ticket = await this.tickets.get(id);
    return res.render('movement/sap-workflow', { layout: 'layouts/movement', title: `SAP Workflow - ${ticket.ticketNumber}`, ticket });
  }

  @Get('movement-tickets/:id')
  async detail(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const ticket = await this.tickets.get(id);
    return res.render('movement/detail', { layout: 'layouts/movement', title: ticket.ticketNumber, ticket });
  }
}
