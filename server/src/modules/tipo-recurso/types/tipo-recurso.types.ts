import { TipoRecurso } from '@prisma/client';

export interface CreateTipoRecursoDTO {
  nome: string;
}

export interface UpdateTipoRecursoDTO {
  nome?: string;
}

export interface TipoRecursoRepository {
  create(data: CreateTipoRecursoDTO): Promise<TipoRecurso>;
  findMany(): Promise<TipoRecurso[]>;
  findById(id: string): Promise<TipoRecurso | null>;
  update(id: string, data: UpdateTipoRecursoDTO): Promise<TipoRecurso>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByName(nome: string): Promise<boolean>;
  existsByNameExcludingId(nome: string, id: string): Promise<boolean>;
}