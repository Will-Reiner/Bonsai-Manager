import type { GrupoPlanta } from '@prisma/client';

export interface EstadoGrupo {
  grupo: GrupoPlanta | null;
  grupoAnterior: GrupoPlanta | null;
  grupoExpiraEm: Date | null;
}

export const RECEM_TRANSPLANTADA: GrupoPlanta = 'RECEM_TRANSPLANTADA';
export const TRANSPLANTE_PADRAO_DIAS = 15;

/** Preferência `transplante_dias` → dias em Recém transplantada (1–365, padrão 15). */
export function diasDeTransplante(valor: string | null | undefined): number {
  const dias = valor ? parseInt(valor, 10) : NaN;
  if (Number.isNaN(dias)) return TRANSPLANTE_PADRAO_DIAS;
  return Math.min(365, Math.max(1, dias));
}

/** Transplante registrado: vai para Recém transplantada até `data + dias` e depois volta ao grupo de antes. */
export function aplicarTransplante(estado: EstadoGrupo, data: Date, dias: number): EstadoGrupo {
  // Já em Recém transplantada: o grupo de retorno continua o original
  const grupoAnterior = estado.grupo === RECEM_TRANSPLANTADA ? estado.grupoAnterior : estado.grupo;
  return { grupo: RECEM_TRANSPLANTADA, grupoAnterior, grupoExpiraEm: new Date(data.getTime() + dias * 86_400_000) };
}

/** Escolha manual do usuário: cancela qualquer retorno automático. */
export function trocaManual(grupo: GrupoPlanta | null): EstadoGrupo {
  return { grupo, grupoAnterior: null, grupoExpiraEm: null };
}
