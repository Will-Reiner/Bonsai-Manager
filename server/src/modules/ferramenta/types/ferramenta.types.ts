import { Ferramenta } from '@prisma/client';

export interface CreateFerramentaDTO {
  nome: string;
  descricao?: string;
}

export interface UpdateFerramentaDTO {
  nome?: string;
  descricao?: string;
}

export interface FerramentaRepository {
  create(data: CreateFerramentaDTO): Promise<Ferramenta>;
  findMany(): Promise<Ferramenta[]>;
  findById(id: string): Promise<Ferramenta | null>;
  update(id: string, data: UpdateFerramentaDTO): Promise<Ferramenta>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByName(nome: string): Promise<boolean>;
  existsByNameExcludingId(nome: string, id: string): Promise<boolean>;
}