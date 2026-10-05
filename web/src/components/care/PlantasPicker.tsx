import { useMemo, useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { especieNome, plantaTitulo } from '@/lib/format';
import { usePlantas } from '@/lib/queries';
import type { Planta } from '@/types';

const SEM_ESPECIE = 'sem-especie';
const grupoDe = (p: Planta) => p.especieId ?? SEM_ESPECIE;

/** Escolha de várias plantas: busca, "Todas", grupos por espécie e lista com checkbox. */
export function PlantasPicker({
  open,
  onClose,
  selecionadas,
  onConfirmar,
  titulo = 'Escolher plantas',
}: {
  open: boolean;
  onClose: () => void;
  selecionadas: string[];
  onConfirmar: (ids: string[]) => void;
  titulo?: string;
}) {
  const plantas = usePlantas();
  const [sel, setSel] = useState(() => new Set(selecionadas));
  const [busca, setBusca] = useState('');
  const todas = useMemo(() => plantas.data ?? [], [plantas.data]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, { nome: string; ids: string[] }>();
    for (const p of todas) {
      const g = grupoDe(p);
      const atual = mapa.get(g) ?? { nome: g === SEM_ESPECIE ? 'Sem espécie' : especieNome(p.especie), ids: [] };
      atual.ids.push(p.id);
      mapa.set(g, atual);
    }
    return [...mapa.entries()].sort(([a, x], [b, y]) =>
      a === SEM_ESPECIE ? -1 : b === SEM_ESPECIE ? 1 : x.nome.localeCompare(y.nome, 'pt-BR'),
    );
  }, [todas]);

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? todas.filter((p) =>
        [p.identificador, p.nome, p.especie?.nomeComum, p.especie?.nomeCientifico]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(termo)),
      )
    : todas;

  const tudoMarcado = (ids: string[]) => ids.length > 0 && ids.every((id) => sel.has(id));
  const alternarGrupo = (ids: string[]) =>
    setSel((s) => {
      const n = new Set(s);
      if (tudoMarcado(ids)) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <Button block disabled={!sel.size} onClick={() => onConfirmar([...sel])}>
          Pronto{sel.size ? ` (${sel.size})` : ''}
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Buscar por código ou nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            type="search"
          />
        </div>
        {!termo && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`chip ${tudoMarcado(todas.map((p) => p.id)) ? 'chip-active' : ''}`}
              onClick={() => alternarGrupo(todas.map((p) => p.id))}
            >
              Todas ({todas.length})
            </button>
            {grupos.map(([g, { nome, ids }]) => (
              <button
                type="button"
                key={g}
                className={`chip ${tudoMarcado(ids) ? 'chip-active' : ''}`}
                onClick={() => alternarGrupo(ids)}
              >
                {nome} ({ids.length})
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {visiveis.map((p) => {
            const marcada = sel.has(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => alternar(p.id)}
                className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left hover:bg-line/40"
                aria-pressed={marcada}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 ${
                    marcada ? 'border-primary bg-primary text-white' : 'border-line'
                  }`}
                >
                  {marcada && <Check size={14} strokeWidth={3} />}
                </span>
                <PlantThumb url={p.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {p.identificador ? `#${p.identificador} · ` : ''}
                    {plantaTitulo(p)}
                  </span>
                  <span className="block truncate text-xs text-muted">{especieNome(p.especie)}</span>
                </span>
              </button>
            );
          })}
          {!visiveis.length && <p className="py-6 text-center text-sm text-muted">Nenhuma planta encontrada.</p>}
        </div>
      </div>
    </Sheet>
  );
}

/** Campo-resumo ("3 plantas ›") que abre o PlantasPicker. */
export function PlantasCampo({
  ids,
  onChange,
  label = 'Plantas',
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const plantas = usePlantas();
  const [aberto, setAberto] = useState(false);
  const [versao, setVersao] = useState(0);
  const primeira = plantas.data?.find((p) => p.id === ids[0]);
  const resumo = !ids.length
    ? 'Escolha as plantas'
    : ids.length === 1
      ? `${primeira?.identificador ? `#${primeira.identificador} · ` : ''}${plantaTitulo(primeira)}`
      : ids.length === plantas.data?.length
        ? `Todas as plantas (${ids.length})`
        : `${ids.length} plantas`;

  return (
    <div>
      <span className="label">{label}</span>
      <button
        type="button"
        onClick={() => {
          setVersao((v) => v + 1);
          setAberto(true);
        }}
        className="input flex items-center justify-between text-left"
      >
        <span className={`truncate ${ids.length ? '' : 'text-muted'}`}>{plantas.isLoading ? 'Carregando…' : resumo}</span>
        <ChevronRight size={18} className="shrink-0 text-muted" />
      </button>
      <PlantasPicker
        key={versao}
        open={aberto}
        onClose={() => setAberto(false)}
        selecionadas={ids}
        onConfirmar={(novos) => {
          onChange(novos);
          setAberto(false);
        }}
      />
    </div>
  );
}
