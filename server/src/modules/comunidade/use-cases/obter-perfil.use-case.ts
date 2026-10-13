import { autorDe, plantaDe } from '../dominio/montar';
import { podeVerPerfil } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PerfilDTO } from '../comunidade.types';

export class ObterPerfilUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, usuarioId: string): Promise<PerfilDTO> {
    const p = await this.repo.perfil(usuarioId, viewerId);
    if (!p || !podeVerPerfil(p, viewerId)) throw new NaoEncontrado('Perfil não encontrado.');
    const plantas = await this.repo.plantasPublicas(usuarioId);
    return {
      ...autorDe(p),
      bio: p.bio,
      localidade: p.localidade,
      eu: p.id === viewerId,
      sigo: p.sigo,
      contagem: { plantas: p.plantas, seguidores: p.seguidores, seguindo: p.seguindo },
      plantas: plantas.map(plantaDe),
    };
  }
}
