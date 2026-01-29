import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'historial_scraper' })
export class ScraperResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  contenedor: string;

  @Column({ nullable: true })
  resultado: string;

  @Column({ default: 'Libre' })
  clasificacion: string;

  @Column({ nullable: true })
  bloqueado: string;

  @Column({ nullable: true })
  cliente: string;

  @Column({ nullable: true })
  tren_arribo: string;

  @Column({ nullable: true })
  descripcion_mercancia: string;

  @Column({ nullable: true })
  sello_fisico_enviado: string;

  @Column({ nullable: true })
  sello_fisico_pagina: string;

  @Column({ nullable: true })
  sello_documentado_pagina: string;

  @Column({ nullable: true })
  origen: string;

  @Column({ nullable: true })
  agente_aduanal: string;

  @Column({ nullable: true })
  pedimento_transito: string;

  @Column({ nullable: true })
  pedimentos_definitivos: string;

  // 🔥 CAMBIO CLAVE: Usamos @Column normal para tener control total
  // y quitamos @CreateDateColumn que usaba la hora del servidor (UTC)
  @Column({ type: 'timestamp', nullable: true })
  fecha_consulta: Date;
}
