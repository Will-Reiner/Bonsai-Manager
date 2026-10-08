import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { plantasApi } from './endpoints';
import { keys } from './queries';
import { dataCapturaDe, MAX_FOTOS_POR_VEZ, uploadImage } from './upload';
import type { Planta } from '@/types';

export const MAX_FOTOS_LOTE = MAX_FOTOS_POR_VEZ;
const CONCORRENCIA = 3;
/** Id provisório de planta criada na triagem — só vira planta de verdade no salvar. */
const PREFIXO_NOVA = 'nova:';
export const ehNova = (id?: string | null) => !!id?.startsWith(PREFIXO_NOVA);

export interface ItemFoto {
  key: string;
  file: File;
  upload: 'fila' | 'enviando' | 'ok' | 'erro';
  url?: string;
  dataCaptura?: string;
  /** undefined = ainda não triada · null = pulada */
  plantaId?: string | null;
}

/** Planta que pode receber fotos: existente ou nova (pendente, criada no salvar). */
export interface Alvo {
  id: string;
  identificador: number;
  nome?: string | null;
  fotoCapaUrl?: string | null;
  especie?: Planta['especie'];
  nova?: boolean;
}

/** "007" e "7" apontam para a mesma planta. */
export const normalizarCodigo = (codigo: string) => codigo.trim().replace(/^0+(?=\d)/, '');

function criarItens(files: File[], plantaId?: string): ItemFoto[] {
  return files.slice(0, MAX_FOTOS_LOTE).map((file, i) => ({
    key: `${Date.now()}-${i}-${file.name}`,
    file,
    upload: 'fila',
    ...(plantaId ? { plantaId } : {}),
  }));
}

/** Estado de um lote de fotos: triagem por código, plantas novas pendentes e upload em segundo plano. */
export function useLoteFotos(plantas: Planta[] | undefined, filesIniciais: File[] = []) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ItemFoto[]>(() => criarItens(filesIniciais));
  const [novas, setNovas] = useState<string[]>([]);
  const iniciados = useRef(new Set<string>());
  /** id provisório → id real; sobrevive a novas tentativas de salvar (não duplica planta). */
  const criadas = useRef(new Map<string, string>());

  const alvos = useMemo<Alvo[]>(
    () => [...(plantas ?? []), ...novas.map((c) => ({ id: PREFIXO_NOVA + c, identificador: Number(c), nova: true }))],
    [plantas, novas],
  );
  const porCodigo = useMemo(() => {
    const mapa = new Map<string, Alvo>();
    for (const a of alvos) mapa.set(String(a.identificador), a);
    return mapa;
  }, [alvos]);
  const porId = useMemo(() => new Map(alvos.map((a) => [a.id, a])), [alvos]);

  const atualizar = (key: string, patch: Partial<ItemFoto>) =>
    setItems((lista) => lista.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  // Fila de upload: começa assim que a foto tem planta (puladas não sobem)
  useEffect(() => {
    const ativos = items.filter((i) => i.upload === 'enviando').length;
    const proximos = items
      .filter((i) => i.upload === 'fila' && i.plantaId !== null && !iniciados.current.has(i.key))
      .slice(0, Math.max(0, CONCORRENCIA - ativos));
    for (const item of proximos) {
      iniciados.current.add(item.key);
      atualizar(item.key, { upload: 'enviando' });
      Promise.all([uploadImage(item.file), dataCapturaDe(item.file)])
        .then(([url, { data: dataCaptura }]) => atualizar(item.key, { upload: 'ok', url, dataCaptura }))
        .catch(() => atualizar(item.key, { upload: 'erro' }));
    }
  }, [items]);

  const comPlanta = items.filter((i) => i.plantaId);

  return {
    items,
    porCodigo,
    porId,
    trocarArquivos(files: File[], plantaId?: string) {
      iniciados.current.clear();
      criadas.current.clear();
      setNovas([]);
      setItems(criarItens(files, plantaId));
    },
    atribuir: (key: string, plantaId: string | null) => atualizar(key, { plantaId }),
    criarNova(codigo: string): Alvo {
      const c = normalizarCodigo(codigo);
      setNovas((n) => (n.includes(c) ? n : [...n, c]));
      return { id: PREFIXO_NOVA + c, identificador: Number(c), nova: true };
    },
    enviados: items.filter((i) => i.upload === 'ok').length,
    enviaveis: items.filter((i) => i.plantaId !== null).length,
    uploadsPendentes: comPlanta.some((i) => i.upload === 'fila' || i.upload === 'enviando'),
    falhas: comPlanta.filter((i) => i.upload === 'erro'),
    reenviarFalhas() {
      for (const i of items) {
        if (i.plantaId && i.upload === 'erro') {
          iniciados.current.delete(i.key);
          atualizar(i.key, { upload: 'fila' });
        }
      }
    },
    /** Cria as plantas novas que receberam fotos (capa = primeira foto enviada). */
    async criarPlantasNovas(): Promise<Map<string, string>> {
      let criou = false;
      for (const codigo of novas) {
        const provisorio = PREFIXO_NOVA + codigo;
        if (criadas.current.has(provisorio)) continue;
        const capa = items.find((i) => i.plantaId === provisorio && i.upload === 'ok' && i.url);
        if (!capa) continue;
        const planta = await plantasApi.create({ identificador: Number(codigo), fotoCapaUrl: capa.url });
        criadas.current.set(provisorio, planta.id);
        criou = true;
      }
      if (criou) queryClient.invalidateQueries({ queryKey: keys.plantas });
      return criadas.current;
    },
  };
}

export type LoteFotos = ReturnType<typeof useLoteFotos>;
