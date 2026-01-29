// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { User } from './auth/entities/user.entity'; <--- YA NO HACE FALTA IMPORTAR ESTO AQUÍ
import { ScraperModule } from './scraper/scraper.module';
import { ArribosModule } from './arribos/entities/arribos.module';
import { SettingsModule } from './settings/settings.module'; // <--- Importar

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),

          // *** EL CAMBIO MÁGICO ESTÁ AQUÍ ***
          // Eliminamos: entities: [User],
          autoLoadEntities: true, // <--- ESTO CARGA TODAS LAS TABLAS AUTOMÁTICAMENTE
          synchronize: true,
        };
      },
    }),

    AuthModule,
    ScraperModule,
    ArribosModule,
    SettingsModule, // <--- Agregado
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
