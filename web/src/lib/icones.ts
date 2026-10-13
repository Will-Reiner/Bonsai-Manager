import type { Estacao } from '@/types';

/** Ícones próprios (traço sumi) servidos de web/public/icones — ver a skill criando-assets-sumi. */
export const ICONES = [
  'bancada', 'colecao', 'comunidade', 'perfil', 'mais',
  'registrar', 'agendar', 'rotina', 'adicionar-planta', 'fotos-lote', 'preferencias', 'acesso-rapido', 'historico', 'reagendar',
  'rega', 'adubacao', 'adubacao-liquida', 'poda', 'poda-estrutural', 'desfolha', 'aramacao', 'desaramacao',
  'transplante', 'fitossanitario', 'revisao', 'generico', 'atrasada',
  'primavera', 'verao', 'outono', 'inverno',
  'curtir', 'comentar', 'salvar', 'notificacoes', 'seguir',
] as const;

export type NomeIcone = (typeof ICONES)[number];

/** Ícones com desenho próprio para o estado ativo (versão cheia): barra de baixo e ações da Comunidade. */
const COM_ATIVO: readonly NomeIcone[] = ['bancada', 'colecao', 'comunidade', 'perfil', 'curtir', 'comentar', 'salvar', 'notificacoes', 'seguir'];

export const urlIcone = (nome: NomeIcone, ativo = false) =>
  `/icones/${nome}${ativo && COM_ATIVO.includes(nome) ? '-ativo' : ''}.svg`;

/** Por trecho do nome (sem acento, minúsculo); a ordem importa: "liquid" antes de "adub", "poda estrutural" antes de "poda", "desaram" antes de "aram". */
const POR_TRECHO: [string, NomeIcone][] = [
  ['rega', 'rega'],
  ['liquid', 'adubacao-liquida'],
  ['adub', 'adubacao'],
  ['poda estrutural', 'poda-estrutural'],
  ['poda', 'poda'],
  ['desfolha', 'desfolha'],
  ['desaram', 'desaramacao'],
  ['aram', 'aramacao'],
  ['transplante', 'transplante'],
  ['fitossanit', 'fitossanitario'],
  ['praga', 'fitossanitario'],
  ['revis', 'revisao'],
];

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Ícone da atividade pelo nome; desconhecida usa o genérico. */
export function iconeDaAtividade(nome: string): NomeIcone {
  const n = normalizar(nome);
  return POR_TRECHO.find(([trecho]) => n.includes(trecho))?.[1] ?? 'generico';
}

export const ICONE_DA_ESTACAO: Record<Estacao, NomeIcone> = { PRIMAVERA: 'primavera', VERAO: 'verao', OUTONO: 'outono', INVERNO: 'inverno' };
