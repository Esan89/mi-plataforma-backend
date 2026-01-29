import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'arribos_buzones' })
export class BuzonArribo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    capturo: string | null;

    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    folio: string | null;

    @Column({ type: 'date', nullable: true })
    fecha_recepcion: Date | null;

    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    no_pedimento: string | null;

    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    patente: string | null;

    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    clave_pedimento: string | null;

    @Index()
    @Column({ type: 'varchar', nullable: true }) // <-- Agregado type: 'varchar'
    contenedor: string | null;

    @Column({ type: 'text', nullable: true }) // Este ya tenía 'text', está bien
    anexo: string | null;

    @Column({ type: 'text', nullable: true }) // Este ya tenía 'text', está bien
    observaciones: string | null;
}
