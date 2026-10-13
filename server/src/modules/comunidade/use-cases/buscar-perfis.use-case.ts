import { autorDe } from '../dominio/montar';
import type { AutorDTO, LeituraComunidadeRepository } from '../comunidade.types';

const MINIMO = 2;
const LIMITE = 20;

export class BuscarPerfisUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(q: string): Promise<AutorDTO[]> {
    const termo = q.trim();
    if (termo.length < MINIMO) return [];
    return (await this.repo.buscar(termo, LIMITE)).map(autorDe);
  }
}
