import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // 1. Endpoint para consultar en vivo (Scraping)
  @Post('ferrovalle')
  async consultarFerrovalle(
    @Body() body: { textData: string; searchType: string },
  ) {
    // Nota: En tu service se llama 'consultarFerrovalle', asegúrate de usar ese nombre
    return this.scraperService.consultarFerrovalle(
      body.textData,
      body.searchType,
    );
  }

  // 2. 🔥 NUEVO ENDPOINT: Obtener historial completo 🔥
  @Get('ferrovalle')
  async getHistorial() {
    return this.scraperService.obtenerHistorial();
  }

  // 3. Endpoint para actualizar estatus
  @Patch(':id/clasificacion')
  async updateClasificacion(
    @Param('id') id: number,
    @Body('estatus') estatus: string,
  ) {
    return this.scraperService.updateClasificacion(id, estatus);
  }
}
