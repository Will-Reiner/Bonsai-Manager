import { LimpezaDeMidia } from '../midia.types';

/**
 * Dispara a limpeza sem fazer o usuário esperar: a resposta HTTP sai logo e o trabalho continua via
 * `agendar` (na Vercel, `waitUntil` mantém a função viva até a promessa terminar).
 */
export class LimpezaEmSegundoPlano implements LimpezaDeMidia {
  constructor(
    private interna: LimpezaDeMidia,
    private agendar: (promessa: Promise<unknown>) => void,
  ) {}

  async execute(urls: (string | null | undefined)[]): Promise<void> {
    const promessa = this.interna.execute(urls);
    try {
      this.agendar(promessa);
    } catch (error) {
      console.error('Erro ao agendar limpeza de mídias:', error);
    }
  }
}
