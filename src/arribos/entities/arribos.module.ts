import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArribosService } from './arribos.service';
import { ArribosController } from '../arribos.controller';
import { BuzonArribo } from './buzon-arribo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BuzonArribo])],
  controllers: [ArribosController],
  providers: [ArribosService],
})
export class ArribosModule {}
