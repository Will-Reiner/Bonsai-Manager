import type { InteracoesRepository } from '../comunidade.types';

export class MarcarLidasUseCase {
  constructor(private repo: InteracoesRepository) {}

  async execute(viewerId: string): Promise<void> {
    await this.repo.marcarLidas(viewerId);
  }
}
