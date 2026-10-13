import type { LeituraComunidadeRepository } from '../comunidade.types';

export class ContarNaoLidasUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string): Promise<{ total: number }> {
    return { total: await this.leitura.naoLidas(viewerId) };
  }
}
