// Funções puras de montagem de DTO para a tela Adicionar Planta.
// Importa apenas TIPOS (import type) para não puxar runtime (axios/AsyncStorage) no jest.
import type { CreatePlantaDTO } from '../../services/plantaService';
import type { CreateFotoDTO } from '../../services/fotoService';
import type { ModoAquisicao } from '../../types';

export interface AddPlantFormState {
  especieId: string;
  nome?: string;
  identificador?: string;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica: boolean;
}

export interface ReadyMedia {
  tipo: 'FOTO' | 'VIDEO';
  publicUrl: string;
  thumbnailUrl?: string;
  dataCaptura?: Date | null;
}

export function buildCreatePlantaDTO(form: AddPlantFormState): CreatePlantaDTO {
  return {
    especieId: form.especieId,
    nome: form.nome?.trim() || undefined,
    identificador: form.identificador?.trim() || undefined,
    dataAquisicao: form.dataAquisicao ? form.dataAquisicao.toISOString() : undefined,
    modoAquisicao: form.modoAquisicao || undefined,
    observacoes: form.observacoes?.trim() || undefined,
    fotoCapaUrl: form.fotoCapaUrl || undefined,
    plantaPublica: form.plantaPublica,
  };
}

export function buildMemoryFotoDTO(item: ReadyMedia, plantaId: string): CreateFotoDTO {
  return {
    caminhoArquivo: item.publicUrl,
    plantaId,
    tipo: item.tipo,
    thumbnailUrl: item.thumbnailUrl,
    dataCaptura: item.dataCaptura ? item.dataCaptura.toISOString() : undefined,
  };
}
