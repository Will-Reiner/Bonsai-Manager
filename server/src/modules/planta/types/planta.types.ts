import { GrupoPlanta, ModoAquisicao } from '@prisma/client';
import type { PlantaPre, TransplantePendente } from '../dominio/grupo';

// DTOs para entrada do controller (com string para data)
export interface CreatePlantaRequestDTO {
  especieId?: string;
  usuarioId: string;
  nome?: string;
  identificador?: number;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
  grupo?: GrupoPlanta | null;
}

export interface UpdatePlantaRequestDTO {
  especieId?: string;
  nome?: string;
  identificador?: number;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
  grupo?: GrupoPlanta | null;
}

// DTOs para o repositório (com Date)
export interface CreatePlantaDTO {
  especieId?: string;
  usuarioId: string;
  nome?: string;
  identificador: number;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
  grupo?: GrupoPlanta | null;
}

export interface UpdatePlantaDTO {
  especieId?: string;
  nome?: string;
  identificador?: number;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica?: boolean;
  historicoPublico?: boolean;
  grupo?: GrupoPlanta | null;
  grupoAnterior?: GrupoPlanta | null;
  grupoExpiraEm?: Date | null;
}

export interface PlantaWithEspecie {
  id: string;
  especieId: string | null;
  usuarioId: string;
  nome: string | null;
  identificador: number;
  dataAquisicao: Date | null;
  modoAquisicao: ModoAquisicao | null;
  observacoes: string | null;
  fotoCapaUrl: string | null;
  plantaPublica: boolean;
  historicoPublico: boolean;
  grupo?: GrupoPlanta | null;
  grupoAnterior?: GrupoPlanta | null;
  grupoExpiraEm?: Date | null;
  preTransplanteAgendaId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  especie: {
    nomeCientifico: string | null;
    nomeComum: string | null;
  } | null;
}

export interface PlantaRepository {
  create(data: CreatePlantaDTO): Promise<PlantaWithEspecie>;
  findManyByUser(usuarioId: string): Promise<PlantaWithEspecie[]>;
  findByIdAndUser(id: string, usuarioId: string): Promise<PlantaWithEspecie | null>;
  update(id: string, usuarioId: string, data: UpdatePlantaDTO): Promise<PlantaWithEspecie>;
  delete(id: string, usuarioId: string): Promise<void>;
  existsByIdAndUser(id: string, usuarioId: string): Promise<boolean>;
  /** Maior ID (identificador) das plantas do usuário; 0 se ele não tem plantas. */
  maiorIdentificador(usuarioId: string): Promise<number>;
  /** URLs de mídia da planta: capa + arquivos e thumbnails da galeria. */
  findUrlsDeMidia(id: string): Promise<string[]>;
  /** Plantas do usuário com `grupoExpiraEm <= agora` voltam ao grupo anterior. */
  resolverGruposVencidos(usuarioId: string, agora: Date): Promise<void>;
  /** Dias da preferência, Transplantes pendentes e plantas candidatas (em Pré-transplante ou com Transplante pendente). */
  estadoPreTransplante(usuarioId: string): Promise<{ dias: number; plantas: PlantaPre[]; pendentes: TransplantePendente[] }>;
  aplicarMudancasPre(mudancas: (PlantaPre & { grupoLido: GrupoPlanta | null })[]): Promise<void>;
}

export interface EspecieRepository {
  existsById(id: string): Promise<boolean>;
}
