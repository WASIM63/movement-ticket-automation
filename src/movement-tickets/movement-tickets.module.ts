import { Module } from '@nestjs/common';
import { MovementTicketsController } from './movement-tickets.controller';
import { MovementTicketsService } from './movement-tickets.service';
@Module({ controllers: [MovementTicketsController], providers: [MovementTicketsService] })
export class MovementTicketsModule {}
