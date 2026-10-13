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
