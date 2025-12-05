// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common'; // <-- Añade Get, UseGuards, Req
import { AuthGuard } from '@nestjs/passport'; // <-- Importa el AuthGuard
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { type Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  // --- NUEVA RUTA PROTEGIDA ---
  @Get('profile')
  @UseGuards(AuthGuard('jwt')) // <-- ¡Este es el guardia de seguridad!
  getProfile(@Req() req: Request) {
    // Gracias al guard y la estrategia, el usuario ya viene en la solicitud (request)
    return req.user;
  }
}