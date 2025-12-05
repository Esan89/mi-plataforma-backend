import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- ¿Tienes esto?
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperResult } from './entities/scraper-result.entity'; // <--- ¿Y esto?

@Module({
  imports: [
    // VITAL: Esto es lo que le dice a NestJS "Usa esta tabla en este módulo"
    TypeOrmModule.forFeature([ScraperResult]),
  ],
  controllers: [ScraperController],
  providers: [ScraperService],
})
export class ScraperModule {}
