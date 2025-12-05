// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // <-- Importa esto
import { JwtStrategy } from './jwt.strategy'; // <-- Importa la estrategia

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // <-- Añade esto
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'ESTA-ES-MI-PALABRA-SECRETA-CAMBIAR-LUEGO',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // <-- Añade JwtStrategy aquí
})
export class AuthModule {}