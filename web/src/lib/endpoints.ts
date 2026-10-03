// Chamadas à API agrupadas por recurso (mesmas rotas usadas em mobile_app/src/services/*)
import { api } from './api';
import type {
  Agenda,
  AgendaStatus,
  Atividade,
  Especie,
  Foto,
  ModoAquisicao,
  Planta,
  Preferencias,
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
  especieId: string;
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

export const agendasApi = {
  list: () => data<Agenda[]>(api.get('/agendas')),
  create: (body: { plantaId: string; atividadeId: string; dataAgendada: string }) =>
    data<Agenda>(api.post('/agendas', body)),
  update: (id: string, body: AgendaUpdate) => data<Agenda>(api.put(`/agendas/${id}`, body)),
  remove: (id: string) => api.delete(`/agendas/${id}`),
  /** Registra um cuidado já feito: cria a agenda e marca como concluída (mesmo fluxo do QuickInterventionModal). */
  registrarFeito: async (body: { plantaId: string; atividadeId: string; data: string; detalhes?: string }) => {
    const agenda = await agendasApi.create({
      plantaId: body.plantaId,
      atividadeId: body.atividadeId,
      dataAgendada: body.data,
    });
    return agendasApi.update(agenda.id, {
      status: 'CONCLUIDO',
      dataConcluida: body.data,
      ...(body.detalhes ? { detalhes: body.detalhes } : {}),
    });
  },
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
};
