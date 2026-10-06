import type { GrupoPlanta } from '@prisma/client';

export interface EstadoGrupo {
  grupo: GrupoPlanta | null;
  grupoAnterior: GrupoPlanta | null;
  grupoExpiraEm: Date | null;
}

export const RECEM_TRANSPLANTADA: GrupoPlanta = 'RECEM_TRANSPLANTADA';
export const TRANSPLANTE_PADRAO_DIAS = 15;

const DIA_MS = 86_400_000;

export const PRE_TRANSPLANTE: GrupoPlanta = 'PRE_TRANSPLANTE';
export const PRE_TRANSPLANTE_PADRAO_DIAS = 30;

/** Preferência numérica de dias → inteiro entre 1 e 365 (inválido = padrão). */
function limitarDias(valor: string | null | undefined, padrao: number): number {
  const dias = valor ? parseInt(valor, 10) : NaN;
  if (Number.isNaN(dias)) return padrao;
  return Math.min(365, Math.max(1, dias));
}

/** Preferência `transplante_dias` → dias em Recém transplantada (1–365, padrão 15). */
export const diasDeTransplante = (valor: string | null | undefined) => limitarDias(valor, TRANSPLANTE_PADRAO_DIAS);

/** Preferência `pre_transplante_dias` → dias antes do Transplante agendado (1–365, padrão 30). */
export const diasDePreTransplante = (valor: string | null | undefined) => limitarDias(valor, PRE_TRANSPLANTE_PADRAO_DIAS);

/** Transplante registrado: vai para Recém transplantada até `data + dias` e depois volta ao grupo de antes. */
export function aplicarTransplante(estado: EstadoGrupo, data: Date, dias: number): EstadoGrupo {
  // Já em Pré-transplante ou Recém transplantada: o grupo de retorno continua o original
  const grupoAnterior =
    estado.grupo === RECEM_TRANSPLANTADA || estado.grupo === PRE_TRANSPLANTE ? estado.grupoAnterior : estado.grupo;
  return { grupo: RECEM_TRANSPLANTADA, grupoAnterior, grupoExpiraEm: new Date(data.getTime() + dias * DIA_MS) };
}

/** Escolha manual do usuário: cancela qualquer retorno automático. */
export function trocaManual(grupo: GrupoPlanta | null): EstadoGrupo {
  return { grupo, grupoAnterior: null, grupoExpiraEm: null };
}

export interface PlantaPre {
  plantaId: string;
  grupo: GrupoPlanta | null;
  grupoAnterior: GrupoPlanta | null;
  /** Agendamento que já colocou a planta no Pré-transplante. */
  preTransplanteAgendaId: string | null;
}

export interface TransplantePendente {
  plantaId: string;
  agendaId: string;
  dataAgendada: Date;
}

/** Entradas e saídas automáticas do Pré-transplante (só as plantas que mudam, com o estado novo). */
export function planejarPreTransplante(
  plantas: PlantaPre[],
  pendentes: TransplantePendente[],
  agora: Date,
  dias: number,
): PlantaPre[] {
  // Transplante pendente mais cedo de cada planta dentro do prazo (atrasados incluídos)
  const limite = agora.getTime() + dias * DIA_MS;
  const proximaDe = new Map<string, TransplantePendente>();
  for (const p of pendentes) {
    if (p.dataAgendada.getTime() > limite) continue;
    const atual = proximaDe.get(p.plantaId);
    if (!atual || p.dataAgendada < atual.dataAgendada) proximaDe.set(p.plantaId, p);
  }

  return plantas.flatMap((pl): PlantaPre[] => {
    const proxima = proximaDe.get(pl.plantaId);
    if (pl.grupo === PRE_TRANSPLANTE) {
      // Transplante cancelado, apagado, feito ou remarcado para longe: volta ao grupo de antes
      if (!proxima) return [{ plantaId: pl.plantaId, grupo: pl.grupoAnterior, grupoAnterior: null, preTransplanteAgendaId: null }];
      return proxima.agendaId === pl.preTransplanteAgendaId ? [] : [{ ...pl, preTransplanteAgendaId: proxima.agendaId }];
    }
    // Recém transplantada não entra; o mesmo agendamento não coloca de novo (troca manual)
    if (pl.grupo === RECEM_TRANSPLANTADA || !proxima || proxima.agendaId === pl.preTransplanteAgendaId) return [];
    return [{ plantaId: pl.plantaId, grupo: PRE_TRANSPLANTE, grupoAnterior: pl.grupo, preTransplanteAgendaId: proxima.agendaId }];
  });
}
