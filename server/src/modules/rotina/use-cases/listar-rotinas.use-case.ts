import { RotinaRepository } from '../rotina.types';

export class ListarRotinasUseCase {
  constructor(private repo: RotinaRepository) {}

  execute(usuarioId: string, plantaId?: string) {
    return this.repo.listar(usuarioId, plantaId);
  }
}
