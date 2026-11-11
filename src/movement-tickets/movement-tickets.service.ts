import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class MovementTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: any) {
    if (!input.vehicleNumber || !Array.isArray(input.items) || input.items.length === 0)
      throw new BadRequestException('Select a vehicle and add at least one part.');
    for (const item of input.items) {
      if (!item.productCode || !item.quantity || Number(item.quantity) <= 0)
        throw new BadRequestException('Every item needs a part and a quantity greater than zero.');
    }
    const vehicle = await this.prisma.vehicle.findUnique({ where: { registration: input.vehicleNumber } });
    if (!vehicle) throw new BadRequestException('Selected vehicle is not present in active master data.');
    const plant = input.plantCode ? await this.prisma.plant.findUnique({ where: { code: input.plantCode } }) : null;
    if (input.plantCode && !plant) throw new BadRequestException('Selected plant is not present in master data.');
    const date = input.ticketDate ? new Date(input.ticketDate) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Ticket date is invalid.');
    if (input.distanceKm !== undefined && input.distanceKm !== '' && (!Number.isFinite(Number(input.distanceKm)) || Number(input.distanceKm) < 0))
      throw new BadRequestException('Distance must be a valid non-negative number.');
    const ticketNumber = `MT-${date.toISOString().slice(0,10).replace(/-/g,'')}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const ticket = await this.prisma.movementTicket.create({
      data: {
        ticketNumber, ticketDate: date, vehicleNumber: input.vehicleNumber,
        vehicleId: vehicle?.id, plantId: plant?.id, salesOrder: null,
        vendorType: input.vendorType || null, transportMode: input.transportMode || null, vehicleType: input.vehicleType || null,
        distanceKm: input.distanceKm ? new Prisma.Decimal(input.distanceKm) : null,
        notes: input.notes || null,
        items: { create: await Promise.all(input.items.map(async (item: any) => {
          const part = await this.prisma.part.findUnique({ where: { productCode: item.productCode } });
          if (!part) throw new BadRequestException(`Part ${item.productCode} is not present in master data.`);
          return {
            partId: part.id, productCode: part.productCode,
            partName: part.partName,
            customerReference: part.customerReference,
            salesOrder: part.salesOrder || null,
            subM: part.subM, quantity: new Prisma.Decimal(item.quantity), unit: part.unit,
          };
        })) },
      },
      include: { items: true, plant: true, vehicle: true },
    });
    await this.prisma.auditLog.create({ data: { entityType: 'MovementTicket', entityId: String(ticket.id), action: 'CREATED', details: { ticketNumber } } });
    return ticket;
  }

  async list() {
    return this.prisma.movementTicket.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async recordPrint(id: number) {
    const ticket = await this.prisma.movementTicket.update({ where: { id }, data: { printCount: { increment: 1 } }, select: { id: true, printCount: true, ticketNumber: true } });
    await this.prisma.auditLog.create({ data: { entityType: 'MovementTicket', entityId: String(id), action: 'PRINT_INITIATED', details: { printCount: ticket.printCount } } });
    return ticket;
  }

  async get(id: number) {
    const ticket = await this.prisma.movementTicket.findUnique({ where: { id }, include: { items: true, plant: true, vehicle: true } });
    if (!ticket) throw new NotFoundException('Movement ticket not found');
    return ticket;
  }
}
