import { IsString, IsNotEmpty } from 'class-validator';

export class CargaBuzonesDto {
  @IsString()
  @IsNotEmpty()
  data: string;
}
