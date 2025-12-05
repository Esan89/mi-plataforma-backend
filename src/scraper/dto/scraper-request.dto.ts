import { IsNotEmpty, IsString } from 'class-validator';

// La palabra clave "export" es la corrección aquí
export class ScraperRequestDto {
  @IsString()
  @IsNotEmpty()
  textData: string;
}
