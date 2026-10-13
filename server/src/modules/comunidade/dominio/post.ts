// Regras puras dos posts da Comunidade (uma planta num dia com foto).

export const FUSO = 'America/Sao_Paulo';
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });

/** "AAAA-MM-DD" do instante no fuso de São Paulo. */
export function diaLocal(data: Date): string {
  return formatoDia.format(data);
}

export interface FotoParaPost {
  tipo: string;
  dataCaptura: Date | null;
  createdAt: Date;
  agenda: { status: string; dataConcluida: Date | null; dataAgendada: Date } | null;
}

/**
 * Dia do post de uma foto — mesma regra do histórico (`web/src/lib/linhaDoTempo.ts`): foto de cuidado concluído
 * fica no dia do cuidado; as demais, no dia da captura (ou do upload). Visão futura não gera post (null).
 */
export function diaDoPost(f: FotoParaPost): string | null {
  if (f.tipo === 'VISAO_FUTURA') return null;
  const data = f.agenda?.status === 'CONCLUIDO' ? f.agenda.dataConcluida ?? f.agenda.dataAgendada : f.dataCaptura ?? f.createdAt;
  return diaLocal(data);
}

export interface Compartilhamento {
  perfilPublico: boolean;
  plantaPublica: boolean;
  postarAutomatico: boolean;
}

/** Até quantos dias atrás um post novo ainda entra no feed (lote de fotos antigas não inunda). */
export const DIAS_NO_FEED = 7;

const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);

/** Decidido uma vez, quando o post nasce: fora do feed salvo se tudo é público, automático e recente. */
export function decidirNoFeed(c: Compartilhamento, dia: string, hoje: string): boolean {
  const recente = diasEntre(dia, hoje) <= DIAS_NO_FEED;
  return !(c.perfilPublico && c.plantaPublica && c.postarAutomatico && recente);
}

export interface PlanoPosts {
  criar: { dia: string; noFeed: boolean }[];
  apagar: string[];
}

/** Compara os dias com foto da planta com os posts que ela tem: cria os que faltam e apaga os que sobram. */
export function planejarPosts(fotos: FotoParaPost[], diasComPost: string[], c: Compartilhamento, agora: Date): PlanoPosts {
  const dias = new Set(fotos.map(diaDoPost).filter((d): d is string => d !== null));
  const existentes = new Set(diasComPost);
  const hoje = diaLocal(agora);
  return {
    criar: [...dias]
      .filter((d) => !existentes.has(d))
      .sort()
      .map((dia) => ({ dia, noFeed: decidirNoFeed(c, dia, hoje) })),
    apagar: [...existentes].filter((d) => !dias.has(d)).sort(),
  };
}
