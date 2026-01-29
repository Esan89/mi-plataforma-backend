// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerAuthDto: RegisterAuthDto) {
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

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    // 1. Buscar al usuario por su email
    const user = await this.userRepository.findOne({ where: { email } });
    console.log('Login attempt for:', email);
    console.log('User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('User not found in DB');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Comparar la contraseña enviada con la guardada en la BD
    console.log('Password provided:', password);
    console.log('Stored hash:', user.password_hash);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password mismatch');
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