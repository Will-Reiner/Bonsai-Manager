import type { Db } from '../planta/use-cases/reavaliar-grupos';
import type { Compartilhamento, FotoParaPost, PlanoPosts } from './dominio/post';

export interface EstadoPostsDaPlanta extends Compartilhamento {
  plantaId: string;
  usuarioId: string;
  fotos: FotoParaPost[];
  /** Dias ("AAAA-MM-DD") que já têm post. */
  diasComPost: string[];
}

export interface PostsRepository {
  estadoDasPlantas(plantaIds: string[], db?: Db): Promise<EstadoPostsDaPlanta[]>;
  aplicar(plantaId: string, usuarioId: string, plano: PlanoPosts, db?: Db): Promise<void>;
}

/** Quem grava fotos ou tarefas chama no fim, com as plantas tocadas. */
export interface SincronizadorDePosts {
  execute(tocadas: { plantaIds: string[] }, usuarioId?: string, db?: Db): Promise<void>;
}

// ---- Leitura (fase 2) ----

export type AbaFeed = 'seguindo' | 'explorar';
export interface UsuarioLido { id: string; nome: string; nomePublico: string | null; fotoPerfilUrl: string | null; perfilPublico: boolean; historicoPublico: boolean }
export interface EspecieLida { nomeComum: string | null; nomeCientifico: string | null }
export interface PlantaLidaBase { id: string; identificador: number; nome: string | null; fotoCapaUrl: string | null; plantaPublica: boolean; especie: EspecieLida | null }
export interface PostLido { id: string; dia: Date; publicadoEm: Date; plantaId: string; usuario: UsuarioLido; planta: PlantaLidaBase }
export interface PlantaLida extends PlantaLidaBase { usuario: UsuarioLido; posts: { id: string; dia: Date }[] }
export interface PerfilLido extends UsuarioLido { bio: string | null; localidade: string | null; plantas: number; seguidores: number; seguindo: number; sigo: boolean }
export interface FotoLida extends FotoParaPost { id: string; plantaId: string; caminhoArquivo: string; thumbnailUrl: string | null }
export interface CuidadoLido { plantaId: string; dataConcluida: Date | null; dataAgendada: Date; detalhes: string | null; observacaoFutura: string | null; atividade: { nome: string } }
export interface FotoDoPost { id: string; url: string; tipo: string; thumbnailUrl: string | null }
export interface CuidadoDoPost { atividade: string; detalhes: string | null; observacao: string | null }
export interface AutorDTO { id: string; nome: string; fotoPerfilUrl: string | null }
export interface PlantaDTO { id: string; identificador: number; nome: string | null; fotoCapaUrl: string | null; especie: EspecieLida | null }
export interface PostDTO { id: string; dia: string; publicadoEm: Date; autor: AutorDTO; planta: PlantaDTO; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface DiaPublicoDTO { dia: string; postId: string | null; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface PlantaPublicaDTO { planta: PlantaDTO; dono: AutorDTO; dias: DiaPublicoDTO[] }
export interface PerfilDTO extends AutorDTO { bio: string | null; localidade: string | null; eu: boolean; sigo: boolean; contagem: { plantas: number; seguidores: number; seguindo: number }; plantas: PlantaDTO[] }
export interface PaginaDTO<T> { itens: T[]; proximoCursor: string | null }

/** Post/perfil/planta que não existe ou que o leitor não pode ver (vira 404). */
export class NaoEncontrado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'NaoEncontrado';
  }
}
