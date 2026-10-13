import { conteudoPorDia } from '../dominio/conteudo';
import { autorDe, linhaDoTempoPublica, plantaDe } from '../dominio/montar';
import { mostraCuidados, podeVer } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PlantaPublicaDTO } from '../comunidade.types';

export class ObterPlantaPublicaUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, plantaId: string): Promise<PlantaPublicaDTO> {
    const planta = await this.repo.planta(plantaId);
    if (!planta || !podeVer(planta.usuario, planta.plantaPublica, viewerId)) throw new NaoEncontrado('Planta não encontrada.');
    const { fotos, cuidados } = await this.repo.conteudo([planta.id]);
    return {
      planta: plantaDe(planta),
      dono: autorDe(planta.usuario),
      dias: linhaDoTempoPublica(planta.id, planta.posts, conteudoPorDia(fotos, cuidados), mostraCuidados(planta.usuario, viewerId)),
    };
  }
}
