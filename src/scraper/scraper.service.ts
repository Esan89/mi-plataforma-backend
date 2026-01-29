import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { ScraperResult } from './entities/scraper-result.entity';

export interface IScrapeResult {
  id?: number;
  contenedor: string;
  sello_fisico_enviado: string;
  bloqueado: string;
  sello_fisico_pagina: string;
  sello_documentado_pagina: string;
  resultado: string;
  origen: string;
  agente_aduanal: string;
  pedimento_transito: string;
  pedimentos_definitivos: string;
  cliente: string;
  tren_arribo: string;
  descripcion_mercancia: string;
  clasificacion?: string;
}

const normalizeAndSplitSeals = (
  sealString: string | null | undefined,
): Set<string> => {
  if (!sealString) return new Set();
  const seals = sealString
    .toUpperCase()
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return new Set(seals);
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 500));



import { SettingsService } from '../settings/settings.service'; // <--- Importar

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(ScraperResult)
    private scraperRepository: Repository<ScraperResult>,
    private readonly settingsService: SettingsService, // <--- Inyectar
  ) { }

  async updateClasificacion(id: number, estatus: string) {
    return this.scraperRepository.update(id, { clasificacion: estatus });
  }

  async consultarFerrovalle(
    textData: string,
    searchType: string,
  ): Promise<IScrapeResult[]> {
    this.logger.log('Iniciando proceso de scraping para Ferrovalle...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    );
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    const results: IScrapeResult[] = [];

    try {
      this.logger.log('Navegando a la página de login...');
      await page.goto('https://sli.ferrovalle.com.mx/inicioSli/#/login', {
        waitUntil: 'networkidle0',
      });

      const user = await this.settingsService.getValue('FERROVALLE_USER');
      const password = await this.settingsService.getValue('FERROVALLE_PASSWORD');

      if (!user || !password) {
        throw new InternalServerErrorException(
          'Credenciales de Ferrovalle no encontradas en la base de datos (Settings)',
        );
      }

      const userInputSelector = '#id_filter_user';
      await page.waitForSelector(userInputSelector, { visible: true });
      await page.type(userInputSelector, user, { delay: 100 });
      await sleep(500);
      const passwordInputSelector = 'input[placeholder="Contraseña"]';
      await page.waitForSelector(passwordInputSelector, { visible: true });
      await page.type(passwordInputSelector, password, { delay: 100 });
      await sleep(1000);
      const loginButtonSelector = 'button[type="submit"]';
      await page.waitForSelector(loginButtonSelector);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(loginButtonSelector),
      ]);

      const sliMenuSelector =
        'a.dropdown-toggle[ng-show="sec.CanView(\'WEB_MAIN\')"]';
      await page.waitForSelector(sliMenuSelector, { visible: true });
      await page.click(sliMenuSelector);
      await sleep(500);

      const consultaLinkSelector = 'a[href="#/aduana/CAAContainersADU"]';
      await page.waitForSelector(consultaLinkSelector, { visible: true });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click(consultaLinkSelector),
      ]);

      const lines = textData
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      for (const line of lines) {
        const parts = line
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const contenedor = parts[0];
        const selloFisicoEnviado = parts[1] || '';
        if (!contenedor) continue;

        const inicial = contenedor.slice(0, 4);
        const numero = contenedor.slice(4);

        this.logger.log(`Procesando contenedor: ${contenedor}`);
        const inicialInputSelector = 'input[ng-model="filter.prefixContainer"]';
        const numeroInputSelector = 'input[ng-model="filter.numberContainer"]';
        const buscarButtonSelector = 'button[tooltip="Buscar Inicial/Numero"]';
        const cancelButtonSelector = 'button[ng-click="Cancel()"]';
        const detailPageSelector =
          'input[ng-model="containerDet.containerName"]';

        await page.waitForSelector(inicialInputSelector, { visible: true });
        await page.evaluate(
          (sel1, sel2) => {
            (document.querySelector(sel1) as HTMLInputElement).value = '';
            (document.querySelector(sel2) as HTMLInputElement).value = '';
          },
          inicialInputSelector,
          numeroInputSelector,
        );
        await page.type(inicialInputSelector, inicial, { delay: 50 });
        await page.type(numeroInputSelector, numero, { delay: 50 });
        await sleep(500);
        await page.click(buscarButtonSelector);
        await sleep(2000);

        const linkClickSelector = 'a[ng-click="Select(container)"]';
        let detailFound = false;
        const targetText = searchType || 'Fiscalizado';

        try {
          // 🔥 MODIFICACIÓN: Aumentamos a 5 intentos
          for (let attempt = 1; attempt <= 5; attempt++) {
            const linkClicked = await page.evaluate(
              (selector, text) => {
                const links = Array.from(document.querySelectorAll(selector));
                const targetLink = links.find(
                  (link) => link.textContent?.trim() === text,
                );
                if (targetLink) {
                  (targetLink as HTMLElement).click();
                  return true;
                }
                return false;
              },
              linkClickSelector,
              targetText,
            );
            if (linkClicked) {
              await page.waitForSelector(detailPageSelector, {
                visible: true,
                timeout: 15000,
              });
              await sleep(1000);
              detailFound = true;
              break;
            } else {
              // Esperamos 2 segundos entre intentos, excepto en el último
              if (attempt < 5) await sleep(2000);
            }
          }
        } catch (e: any) {
          detailFound = false;
        }

        let scrapedData: Partial<IScrapeResult> = {
          bloqueado: 'N/A',
          sello_fisico_pagina: 'N/A',
          sello_documentado_pagina: 'N/A',
          origen: 'N/A',
          agente_aduanal: 'N/A',
          pedimento_transito: 'N/A',
          pedimentos_definitivos: 'N/A',
          cliente: 'N/A',
          tren_arribo: 'N/A',
          descripcion_mercancia: 'N/A',
        };

        if (detailFound) {
          scrapedData = await page.evaluate(() => {
            const getInputValue = (model: string) => {
              const element = document.querySelector(
                `input[ng-model="${model}"]`,
              ) as HTMLInputElement;
              return element ? element.value.trim() : 'No encontrado';
            };
            const extractPedimentos = (): string => {
              const tableBody = document.querySelector(
                'table.table-condensed tbody',
              );
              if (!tableBody) return 'No encontrado';
              const rows = Array.from(
                tableBody.querySelectorAll(
                  'tr[ng-repeat="pedimento in containerDet.Pedimentos "]',
                ),
              );
              return (
                rows
                  .map((row) =>
                    row.querySelector('td:nth-child(1)')?.textContent?.trim(),
                  )
                  .filter((p) => p && p.length > 0)
                  .join(', ') || 'N/A'
              );
            };
            return {
              bloqueado: getInputValue('containerDet.mot_MotivoId'),
              sello_fisico_pagina: getInputValue('containerDet.seals2') || '',
              sello_documentado_pagina:
                getInputValue('containerDet.seals1') || '',
              origen: getInputValue('containerDet.originName'),
              agente_aduanal: getInputValue('containerDet.agenteName'),
              pedimento_transito: getInputValue('containerDet.pl1Pedimento'),
              pedimentos_definitivos: extractPedimentos(),
              cliente: getInputValue('containerDet.customerName'),
              tren_arribo: getInputValue('containerDet.trainName'),
              descripcion_mercancia: getInputValue(
                'containerDet.pl1DescripcionMercancia',
              ),
            };
          });
        }

        let resultado = 'OK';
        if (detailFound) {
          const phys = normalizeAndSplitSeals(scrapedData.sello_fisico_pagina);
          const doc = normalizeAndSplitSeals(
            scrapedData.sello_documentado_pagina,
          );
          if (phys.size > 0 || doc.size > 0) {
            let match = false;
            for (const s of phys) if (doc.has(s)) match = true;
            if (!match) resultado = 'SDD';
          }
        } else {
          resultado = 'DFNE';
        }

        results.push({
          contenedor,
          sello_fisico_enviado: selloFisicoEnviado,
          bloqueado: scrapedData.bloqueado || 'N/A',
          sello_fisico_pagina: scrapedData.sello_fisico_pagina || 'N/A',
          sello_documentado_pagina:
            scrapedData.sello_documentado_pagina || 'N/A',
          origen: scrapedData.origen || 'N/A',
          agente_aduanal: scrapedData.agente_aduanal || 'N/A',
          pedimento_transito: scrapedData.pedimento_transito || 'N/A',
          pedimentos_definitivos: scrapedData.pedimentos_definitivos || 'N/A',
          cliente: scrapedData.cliente || 'N/A',
          tren_arribo: scrapedData.tren_arribo || 'N/A',
          descripcion_mercancia: scrapedData.descripcion_mercancia || 'N/A',
          resultado,
        });

        if (detailFound) {
          await page.click(cancelButtonSelector);
          await page.waitForSelector(inicialInputSelector, { visible: true });
        } else {
          try {
            await page.goto(
              'https://sli.ferrovalle.com.mx/inicioSli/#/aduana/CAAContainersADU',
              { waitUntil: 'networkidle0' },
            );
            await page.waitForSelector(inicialInputSelector, { visible: true });
          } catch {
            throw new InternalServerErrorException('Error nav');
          }
        }
      }

      // Guardado en BD
      let savedResults: ScraperResult[] = [];
      if (results.length > 0) {
        this.logger.log(
          `Guardando ${results.length} resultados en el historial...`,
        );
        const entidades = results.map((res) => {
          return this.scraperRepository.create({
            contenedor: res.contenedor,
            resultado: res.resultado,
            bloqueado: res.bloqueado,
            cliente: res.cliente,
            tren_arribo: res.tren_arribo,
            descripcion_mercancia: res.descripcion_mercancia,
            sello_fisico_enviado: res.sello_fisico_enviado,
            sello_fisico_pagina: res.sello_fisico_pagina,
            sello_documentado_pagina: res.sello_documentado_pagina,
            origen: res.origen,
            agente_aduanal: res.agente_aduanal,
            pedimento_transito: res.pedimento_transito,
            pedimentos_definitivos: res.pedimentos_definitivos,
            clasificacion: 'Libre',
            // 🔥 CORRECCIÓN: Guardamos fecha actual (UTC)
            // El frontend se encargará de convertirla a la hora local del usuario
            fecha_consulta: new Date(),
          });
        });

        savedResults = await this.scraperRepository.save(entidades);
        this.logger.log('Datos guardados correctamente.');
      }

      return savedResults as any;
    } catch (error: any) {
      this.logger.error('Fallo el scraping', (error as Error).stack);
      if (page && !page.isClosed()) {
        await page.screenshot({ path: 'error_screenshot.png' });
      }
      throw new InternalServerErrorException('El proceso de scraping falló.');
    } finally {
      if (browser) await browser.close();
    }
  }

  async obtenerHistorial() {
    this.logger.log('Consultando historial completo de la BD...');
    return this.scraperRepository.find({
      order: { fecha_consulta: 'DESC' },
      take: 500,
    });
  }
}
