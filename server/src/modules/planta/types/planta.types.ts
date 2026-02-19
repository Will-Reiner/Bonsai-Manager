import { ModoAquisicao } from '@prisma/client';

// DTOs para entrada do controller (com string para data)
export interface CreatePlantaRequestDTO {
  especieId: string;
  usuarioId: string;
  nome?: string;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  visao?: string;
  observacoes?: string;
  fotoCapaUrl?: string;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
}

export interface UpdatePlantaRequestDTO {
  especieId?: string;
  nome?: string;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  visao?: string;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
}

// DTOs para o repositório (com Date)
export interface CreatePlantaDTO {
  especieId: string;
  usuarioId: string;
  nome?: string;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  visao?: string;
  observacoes?: string;
  fotoCapaUrl?: string;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
}

export interface UpdatePlantaDTO {
  especieId?: string;
  nome?: string;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  visao?: string;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
}

export interface PlantaWithEspecie {
  id: string;
  especieId: string;
  usuarioId: string;
  nome: string | null;
  dataAquisicao: Date | null;
  modoAquisicao: ModoAquisicao | null;
  visao: string | null;
  observacoes: string | null;
  fotoCapaUrl: string | null;
  plantaPublica: boolean;
  historicoPublico: boolean;
  createdAt: Date;
  updatedAt: Date;
  especie: {
    nomeCientifico: string;
    nomeComum: string | null;
  };
}

export interface PlantaRepository {
  create(data: CreatePlantaDTO): Promise<PlantaWithEspecie>;
  findManyByUser(usuarioId: string): Promise<PlantaWithEspecie[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<PlantaWithEspecie | null>;
  update(id: string, usuarioId: string, data: UpdatePlantaDTO): Promise<PlantaWithEspecie>;
  delete(id: string, usuarioId: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
}

export interface EspecieRepository {
  existsById(id: string): Promise<boolean>;
}