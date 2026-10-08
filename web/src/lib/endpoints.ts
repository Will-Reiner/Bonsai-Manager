// Chamadas à API agrupadas por recurso (mesmas rotas usadas em mobile_app/src/services/*)
import { api } from './api';
import type {
  Agenda,
  AgendaStatus,
  Atividade,
  Especie,
  Estacao,
  Foto,
  GrupoPlanta,
  GuiaSazonal,
  ModoAquisicao,
  Planta,
  Preferencias,
  Rotina,
  TipoRecurso,
  Usuario,
} from '@/types';

const data = <T>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);

export const authApi = {
  login: (email: string, senha: string) =>
    data<{ token: string; user: Usuario }>(api.post('/auth/login', { email, senha })),
  register: (body: { nome: string; email: string; senha: string }) =>
    data<Usuario>(api.post('/auth/register', body)),
  me: () => data<Usuario>(api.get('/auth/me')),
  updateMe: (body: Partial<Pick<Usuario, 'nome' | 'nomePublico' | 'localidade' | 'bio' | 'perfilPublico'>> & {
    fotoPerfilUrl?: string;
  }) => data<Usuario>(api.put('/auth/me', body)),
};

export interface PlantaInput {
  grupo?: GrupoPlanta | null;
  especieId?: string;
  nome?: string;
  identificador?: string | null;
  dataAquisicao?: string | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
}

export const plantasApi = {
  list: () => data<Planta[]>(api.get('/plantas')),
  get: (id: string) => data<Planta>(api.get(`/plantas/${id}`)),
  create: (body: PlantaInput) => data<Planta>(api.post('/plantas', body)),
  update: (id: string, body: Partial<PlantaInput>) => data<Planta>(api.put(`/plantas/${id}`, body)),
  remove: (id: string) => api.delete(`/plantas/${id}`),
};

export interface AgendaUpdate {
  dataAgendada?: string;
  dataConcluida?: string | null;
  status?: AgendaStatus;
  detalhes?: string;
  observacaoFutura?: string;
}

export interface Repetir {
  intervaloDias: number;
  dataFim?: string;
  estacoes?: Estacao[];
}

export interface ProximoInput {
  atividadeId: string;
  dataAgendada: string;
  /** Com repetição, vira (ou usa) a rotina da planta+atividade. */
  repetir?: Repetir;
}

export interface ConcluirInput {
  dataConcluida: string;
  atividadeId?: string;
  detalhes?: string;
  observacaoFutura?: string;
  extras?: string[];
  proximos?: ProximoInput[];
  itens: { agendaId: string; detalhes?: string; observacaoFutura?: string; fotos?: string[] }[];
  moverRecemTransplantada?: boolean;
}

export interface RegistrarInput {
  data: string;
  plantas: {
    plantaId: string;
    atividadeIds: string[];
    detalhes?: string;
    observacaoFutura?: string;
    fotos?: { caminhoArquivo: string; dataCaptura?: string }[];
  }[];
  proximos?: ProximoInput[];
  /** Pendentes que este registro conclui (escolhidas na tela). */
  concluirAgendaIds?: string[];
  /** Plantas com Transplante vão para Recém transplantada. */
  moverRecemTransplantada?: boolean;
}

export interface ConcluirResultado {
  concluidas: Agenda[];
  criadas: Agenda[];
}

export const agendasApi = {
  list: () => data<Agenda[]>(api.get('/agendas')),
  create: (body: { plantaId: string; atividadeId: string; dataAgendada: string }) =>
    data<Agenda>(api.post('/agendas', body)),
  /** Vários cuidados para várias plantas na mesma data (tudo ou nada). `detalhes` = observação/instrução. */
  createLote: (body: { plantaIds: string[]; atividadeIds: string[]; dataAgendada: string; detalhes?: string }) =>
    data<Agenda[]>(api.post('/agendas/lote', body)),
  update: (id: string, body: AgendaUpdate) => data<Agenda>(api.put(`/agendas/${id}`, body)),
  remove: (id: string) => api.delete(`/agendas/${id}`),
  /** Registra um cuidado já feito (fotos + plantas + próximos passos) numa chamada. */
  registrar: (body: RegistrarInput) => data<ConcluirResultado>(api.post('/agendas/registrar', body)),
  /** Conclui uma ou várias tarefas (com extras e próximos passos). */
  concluir: (body: ConcluirInput) => data<ConcluirResultado>(api.post('/agendas/concluir', body)),
  /** "Pular esta vez" (só tarefa de rotina): a próxima conta a partir de hoje. */
  /** "Pular esta vez"; `proxima` diz se a rotina ganhou a próxima tarefa. */
  pular: (id: string) => data<{ proxima: boolean }>(api.post(`/agendas/${id}/pular`)),
};

export const guiasSazonaisApi = {
  porEspecie: (especieId: string) => data<GuiaSazonal[]>(api.get(`/guias-sazonais/especie/${especieId}`)),
};

export const rotinasApi = {
  list: () => data<Rotina[]>(api.get('/rotinas')),
  /** Uma rotina por planta+atividade; as que já existiam voltam em `conflitos` (mantidas). */
  create: (body: {
    plantaIds: string[];
    atividadeIds: string[];
    intervaloDias: number;
    dataFim?: string;
    estacoes?: Estacao[];
    primeiraData?: string;
    detalhes?: string;
  }) => data<{ criadas: Rotina[]; conflitos: { plantaId: string; atividadeId: string }[] }>(api.post('/rotinas', body)),
  update: (id: string, body: { intervaloDias?: number; dataFim?: string | null; estacoes?: Estacao[] }) =>
    data<Rotina>(api.put(`/rotinas/${id}`, body)),
  remove: (id: string) => api.delete(`/rotinas/${id}`),
  pausar: (id: string) => data<Rotina>(api.post(`/rotinas/${id}/pausar`)),
  /** Retoma a rotina; sem pendente, agenda a próxima a partir de hoje. */
  retomar: (id: string) => data<Rotina>(api.post(`/rotinas/${id}/retomar`)),
};

export const fotosApi = {
  listByPlanta: (plantaId: string) => data<Foto[]>(api.get(`/fotos/planta/${plantaId}`)),
  create: (body: { caminhoArquivo: string; plantaId?: string | null; titulo?: string; dataCaptura?: string | null }) =>
    data<Foto>(api.post('/fotos', { ...body, tipo: 'FOTO' })),
  remove: (id: string) => api.delete(`/fotos/${id}`),
};

export const midiaApi = {
  presign: (fileName: string, fileType: string) =>
    data<{ uploadUrl: string; publicUrl: string; key: string }>(
      api.post('/midia/presigned-url', { fileName, fileType }),
    ),
};

export type EspecieInput = Partial<Omit<Especie, 'id'>>;

export const especiesApi = {
  list: () => data<Especie[]>(api.get('/especies')),
  sugeridas: () => data<Especie[]>(api.get('/especies/sugeridas')),
  create: (body: EspecieInput) => data<Especie>(api.post('/especies', body)),
  update: (id: string, body: EspecieInput) => data<Especie>(api.put(`/especies/${id}`, body)),
  remove: (id: string) => api.delete(`/especies/${id}`),
};

export type AtividadeInput = Partial<Omit<Atividade, 'id'>> & { nome: string };

export const atividadesApi = {
  list: () => data<Atividade[]>(api.get('/atividades')),
  create: (body: AtividadeInput) => data<Atividade>(api.post('/atividades', body)),
  update: (id: string, body: Partial<AtividadeInput>) => data<Atividade>(api.put(`/atividades/${id}`, body)),
  remove: (id: string) => api.delete(`/atividades/${id}`),
};

export const tiposRecursoApi = {
  list: () => data<TipoRecurso[]>(api.get('/tipos-recurso')),
  create: (nome: string) => data<TipoRecurso>(api.post('/tipos-recurso', { nome })),
  update: (id: string, nome: string) => data<TipoRecurso>(api.put(`/tipos-recurso/${id}`, { nome })),
  remove: (id: string) => api.delete(`/tipos-recurso/${id}`),
};

export const preferenciasApi = {
  get: () => data<Preferencias>(api.get('/preferencias')),
  set: (chave: string, valor: string) => api.put(`/preferencias/${chave}`, { valor }),
};
