import { TipoPlanta, RecomendacaoTecnica, Estacao, MomentoIdeal, StatusEspecie } from '@prisma/client';

// DTOs para requisições
export interface CreateEspecieRequestDTO {
  nomeCientifico?: string;
  nomeComum?: string;
  familia?: string;
  origem?: string;
  tipoDePlanta?: TipoPlanta;
  status?: StatusEspecie;
  criadoPorId?: string;
  folhas?: string;
  tronco?: string;
  flores?: string;
  frutos?: string;
  raizes?: string;
  luminosidade?: string;
  rega?: string;
  substratoIdeal?: string;
  adubacao?: string;
  clima?: string;
  problemasComuns?: string;
  pros?: string;
  contras?: string;
  linhasDeRaciocinio?: string;
  observacoes?: string;
}

export interface UpdateEspecieRequestDTO {
  nomeCientifico?: string;
  nomeComum?: string;
  familia?: string;
  origem?: string;
  tipoDePlanta?: TipoPlanta;
  status?: StatusEspecie;
  folhas?: string;
  tronco?: string;
  flores?: string;
  frutos?: string;
  raizes?: string;
  luminosidade?: string;
  rega?: string;
  substratoIdeal?: string;
  adubacao?: string;
  clima?: string;
  problemasComuns?: string;
  pros?: string;
  contras?: string;
  linhasDeRaciocinio?: string;
  observacoes?: string;
}

// DTOs para respostas
export interface EspecieResponseDTO {
  id: string;
  nomeCientifico: string | null;
  nomeComum: string | null;
  familia: string | null;
  origem: string | null;
  tipoDePlanta: TipoPlanta | null;
  status: StatusEspecie;
  criadoPorId: string | null;
  folhas: string | null;
  tronco: string | null;
  flores: string | null;
  frutos: string | null;
  raizes: string | null;
  luminosidade: string | null;
  rega: string | null;
  substratoIdeal: string | null;
  adubacao: string | null;
  clima: string | null;
  problemasComuns: string | null;
  pros: string | null;
  contras: string | null;
  linhasDeRaciocinio: string | null;
  observacoes: string | null;
}

export interface EspecieWithRelationsResponseDTO extends EspecieResponseDTO {
  criadoPor?: { id: string; nome: string; nomePublico: string | null } | null;
  guiasDeTecnicas: {
    especieId: string;
    atividadeId: string;
    recomendacao: RecomendacaoTecnica;
    observacoes: string | null;
    atividade: {
      id: string;
      nome: string;
      descricao: string | null;
    };
  }[];
  guiasSazonais: {
    especieId: string;
    atividadeId: string;
    estacao: Estacao;
    momentoIdeal: MomentoIdeal;
    observacoes: string | null;
    atividade: {
      id: string;
      nome: string;
      descricao: string | null;
    };
  }[];
}

// Repository interface
export interface EspecieRepository {
  create(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO>;
  findAll(): Promise<EspecieResponseDTO[]>;
  findById(id: string): Promise<EspecieWithRelationsResponseDTO | null>;
  findByStatus(status: StatusEspecie): Promise<EspecieResponseDTO[]>;
  update(id: string, data: UpdateEspecieRequestDTO): Promise<EspecieResponseDTO>;
  delete(id: string): Promise<void>;
  existsByNomeCientifico(nomeCientifico: string): Promise<boolean>;
  existsByNomeCientificoExcludingId(nomeCientifico: string, excludeId: string): Promise<boolean>;
}
