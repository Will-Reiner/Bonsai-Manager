import { UnidadeMedida } from '@prisma/client';

export interface CreateRecursoDTO {
  tipoRecursoId: string;
  quantidadeDisponivel: number;
  unidadeMedida?: UnidadeMedida;
  observacoes?: string;
}

export interface UpdateRecursoDTO {
  tipoRecursoId?: string;
  quantidadeDisponivel?: number;
  unidadeMedida?: UnidadeMedida;
  observacoes?: string;
}

export interface RecursoRepository {
  create(data: CreateRecursoDTO, usuarioId: string): Promise<any>;
  findManyByUser(usuarioId: string): Promise<any[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<any | null>;
  update(id: string, data: UpdateRecursoDTO): Promise<any>;
  delete(id: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
}