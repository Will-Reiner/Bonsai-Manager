import { diaDoPost, diaLocal } from './post';
import type { CuidadoDoPost, CuidadoLido, FotoDoPost, FotoLida } from '../comunidade.types';

export interface ConteudoDoDia {
  fotos: FotoDoPost[];
  cuidados: CuidadoDoPost[];
}

export const chaveDoDia = (plantaId: string, dia: string) => `${plantaId}|${dia}`;

/** Fotos e cuidados concluídos agrupados por planta + dia (mesma regra de dia do post). Fotos em ordem cronológica. */
export function conteudoPorDia(fotos: FotoLida[], cuidados: CuidadoLido[]): Map<string, ConteudoDoDia> {
  const mapa = new Map<string, ConteudoDoDia>();
  const doDia = (chave: string) => {
    let c = mapa.get(chave);
    if (!c) mapa.set(chave, (c = { fotos: [], cuidados: [] }));
    return c;
  };
  const momento = (f: FotoLida) => (f.dataCaptura ?? f.createdAt).getTime();
  for (const f of [...fotos].sort((a, b) => momento(a) - momento(b))) {
    const dia = diaDoPost(f);
    if (dia) doDia(chaveDoDia(f.plantaId, dia)).fotos.push({ id: f.id, url: f.caminhoArquivo, tipo: f.tipo, thumbnailUrl: f.thumbnailUrl });
  }
  for (const c of cuidados) {
    doDia(chaveDoDia(c.plantaId, diaLocal(c.dataConcluida ?? c.dataAgendada))).cuidados.push({
      atividade: c.atividade.nome,
      detalhes: c.detalhes,
      observacao: c.observacaoFutura,
    });
  }
  return mapa;
}
