import { RotinaRepository } from '../rotina.types';

export class ApagarRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, usuarioId: string) {
    if (!(await this.repo.findDoUsuario(id, usuarioId))) throw new Error('Rotina não encontrada.');
    await this.repo.apagar(id);
  }
}
