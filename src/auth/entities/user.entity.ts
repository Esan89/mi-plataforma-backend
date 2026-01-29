import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' }) // Esto creará una tabla llamada "users"
export class User {
  @PrimaryGeneratedColumn('uuid') // Generará un ID único y seguro
  id: string;

  @Column({ unique: true }) // El email debe ser único
  email: string;

  @Column()
  password_hash: string; // Aquí guardaremos la contraseña encriptada

  @Column({ default: true }) // Por defecto, los usuarios están activos
  is_active: boolean;

  @CreateDateColumn() // TypeORM se encarga de estas fechas automáticamente
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}