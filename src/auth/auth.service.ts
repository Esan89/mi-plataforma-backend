// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException, // <-- Importa esto
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto'; // <-- Importa el nuevo DTO
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'; // <-- Importa esto

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService, // <-- Inyecta el servicio JWT
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    // ... (el código de registro que ya tienes)
    const { email, password } = registerAuthDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      email,
      password_hash: hashedPassword,
    });

    await this.userRepository.save(newUser);

    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // --- NUEVO MÉTODO DE LOGIN ---
  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    // 1. Buscar al usuario por su email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Comparar la contraseña enviada con la guardada en la BD
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Si todo está bien, generar el JWT (el pase de acceso)
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login exitoso',
      accessToken,
    };
  }
}