import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BuzonArribo } from './buzon-arribo.entity';

@Injectable()
export class ArribosService {
  private readonly logger = new Logger(ArribosService.name);

  constructor(
    @InjectRepository(BuzonArribo)
    private buzonRepository: Repository<BuzonArribo>,
  ) {}

  // 1. Procesar el texto copiado del Excel
  async procesarTextoBuzones(texto: string): Promise<any> {
    this.logger.log('Procesando texto de buzones...');

    // Usamos split regex para manejar mejor saltos de línea de Windows/Mac
    const lineas = texto.trim().split(/\r?\n/);
    const arribos: BuzonArribo[] = [];

    for (const linea of lineas) {
      if (!linea.trim()) continue;

      const col = linea.split('\t');

      // Validación básica de columnas mínimas
      if (col.length < 5) continue;

      // Saltar encabezados si se copiaron
      if (col[0].trim().toUpperCase().includes('CAPTUR')) continue;

      try {
        const arribo = new BuzonArribo();

        arribo.capturo = col[0]?.trim() || null;
        arribo.folio = col[1]?.trim() || null;

        // --- [CAMBIO CLAVE] USO DE LA NUEVA FUNCIÓN INTELEGENTE ---
        // Esto previene el error "invalid syntax" y detecta formato USA vs MX
        arribo.fecha_recepcion = this.limpiarFecha(col[2]);

        arribo.no_pedimento = col[3]?.trim() || null;
        arribo.patente = col[4]?.trim() || null;
        arribo.clave_pedimento = col[5]?.trim() || null;
        arribo.contenedor = col[6]?.trim() || null;

        // Mapeo de Anexo y Observaciones
        arribo.anexo = col[7]?.trim() || null;

        // A veces el excel mete columnas extra vacías, aseguramos que exista la 8
        arribo.observaciones = col[8]?.trim() || null;

        // Solo agregamos si tiene contenedor válido
        if (arribo.contenedor) {
          arribos.push(arribo);
        }
      } catch (e: any) {
        this.logger.warn(
          `Error procesando línea: ${linea}. Detalle: ${(e as Error).message}`,
        );
      }
    }

    if (arribos.length === 0) {
      throw new BadRequestException(
        'No se encontraron datos válidos para guardar.',
      );
    }

    this.logger.log(`Guardando ${arribos.length} registros...`);

    // Guardamos en la BD
    await this.buzonRepository.save(arribos);

    return {
      message: `Se guardaron ${arribos.length} registros de buzones exitosamente.`,
    };
  }

  // 2. Buscar buzones por contenedor (CON BÚSQUEDA FLEXIBLE)
  async findByContenedor(contenedor: string): Promise<BuzonArribo[]> {
    // Limpiamos el input para evitar errores de espacios
    const search = contenedor.trim();
    this.logger.log(`Buscando buzones que coincidan con: ${search}`);

    return this.buzonRepository.find({
      where: {
        // Like 'ABCD%' buscará todo lo que empiece con esas letras
        contenedor: Like(`${search}%`),
      },
      order: { fecha_recepcion: 'DESC' },
    });
  }

  // 3. Obtener todos los registros (orden descendente por ID o fecha)
  async findAll(): Promise<BuzonArribo[]> {
    return this.buzonRepository.find({
      order: {
        id: 'DESC', // O fecha_recepcion: 'DESC'
      },
    });
  }

  // 4. Borrado múltiple
  async removeMultiple(ids: number[]): Promise<any> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No se proporcionaron IDs para eliminar.');
    }

    const result = await this.buzonRepository.delete(ids);

    if (result.affected === 0) {
      throw new BadRequestException('No se encontraron registros para eliminar.');
    }

    return {
      message: `Se eliminaron ${result.affected} registros correctamente.`,
    };
  }

  // --- HELPER PRIVADO PARA LIMPIEZA DE FECHAS ---
  // --- HELPER: MODO ESTRICTO USA (MES / DÍA / AÑO) ---
  // Ideal para copiar desde Excel Online en inglés.
  private limpiarFecha(fechaStr: string): Date | null {
    if (!fechaStr) return null;

    const limpia = fechaStr.trim();
    // Soporta separadores / y -
    const partes = limpia.includes('/') ? limpia.split('/') : limpia.split('-');

    if (partes.length !== 3) return null;

    // EN FORMATO USA:
    // Posición 0 = MES
    // Posición 1 = DÍA
    // Posición 2 = AÑO
    const mes = parseInt(partes[0], 10);
    const dia = parseInt(partes[1], 10);
    const anio = parseInt(partes[2], 10);

    // Validamos que sean números
    if (isNaN(mes) || isNaN(dia) || isNaN(anio)) return null;

    // Validamos rangos básicos para no aceptar basura
    if (mes < 1 || mes > 12) return null;
    if (dia < 1 || dia > 31) return null;

    // Creamos la fecha (mes - 1 porque en JS Enero es 0)
    const fecha = new Date(anio, mes - 1, dia);

    // Validamos que la fecha sea real (ej. evitar 30 de febrero)
    if (isNaN(fecha.getTime()) || fecha.getMonth() !== mes - 1) {
      return null;
    }

    return fecha;
  }
}
