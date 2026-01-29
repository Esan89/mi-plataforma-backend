import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ArribosService } from './arribos.service';
import { CargaBuzonesDto } from './dto/carga-buzones.dto';

@Controller('arribos')
export class ArribosController {
  constructor(private readonly arribosService: ArribosService) { }

  @Post('cargar-texto')
  cargarTexto(@Body() dto: CargaBuzonesDto) {
    return this.arribosService.procesarTextoBuzones(dto.data);
  }

  @Get(':contenedor')
  buscarPorContenedor(@Param('contenedor') contenedor: string) {
    return this.arribosService.findByContenedor(contenedor);
  }

  @Get()
  findAll() {
    return this.arribosService.findAll();
  }

  @Post('borrar-multiples')
  borrarMultiples(@Body() body: { ids: number[] }) {
    return this.arribosService.removeMultiple(body.ids);
  }
}
