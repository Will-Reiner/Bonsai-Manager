import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { especieNome, plantaCodigoNome, termoDeBusca } from '@/lib/format';
import { usePlantas } from '@/lib/queries';
import type { Planta } from '@/types';

const SEM_ESPECIE = 'sem-especie';
const grupoDe = (p: Planta) => p.especieId ?? SEM_ESPECIE;

/** Escolha de várias plantas (controlada): busca, "Todas", grupos por espécie e lista com checkbox. */
export function PlantasLista({ selecionadas, onChange }: { selecionadas: string[]; onChange: (ids: string[]) => void }) {
  const plantas = usePlantas();
  const [busca, setBusca] = useState('');
  const todas = useMemo(() => plantas.data ?? [], [plantas.data]);
  const sel = useMemo(() => new Set(selecionadas), [selecionadas]);

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

  const termo = termoDeBusca(busca);
  const visiveis = termo
    ? todas.filter((p) =>
        [String(p.identificador), p.nome, p.especie?.nomeComum, p.especie?.nomeCientifico]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(termo)),
      )
    : todas;

  const tudoMarcado = (ids: string[]) => ids.length > 0 && ids.every((id) => sel.has(id));
  const alternarGrupo = (ids: string[]) => {
    const n = new Set(sel);
    if (tudoMarcado(ids)) ids.forEach((id) => n.delete(id));
    else ids.forEach((id) => n.add(id));
    onChange([...n]);
  };
  const alternar = (id: string) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange([...n]);
  };

  return (
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
      {/* Grade de fotos: quem escolhe reconhece a planta pela foto */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4">
        {visiveis.map((p) => {
          const marcada = sel.has(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => alternar(p.id)}
              className="min-w-0 text-left transition active:scale-[0.97]"
              aria-pressed={marcada}
            >
              <span className={`relative block overflow-hidden rounded-xl ring-offset-2 ring-offset-bg ${marcada ? 'ring-[3px] ring-primary' : ''}`}>
                <PlantThumb url={p.fotoCapaUrl} className="aspect-square w-full" />
                <span
                  className={`absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border-2 shadow-sm ${
                    marcada ? 'border-primary bg-primary text-white' : 'border-white bg-white/70'
                  }`}
                >
                  {marcada && <Check size={14} strokeWidth={3} />}
                </span>
              </span>
              <span className="mt-1.5 block truncate text-xs font-semibold">{plantaCodigoNome(p)}</span>
              <span className="block truncate text-[11px] text-muted">{especieNome(p.especie)}</span>
            </button>
          );
        })}
      </div>
      {!visiveis.length && <p className="py-6 text-center text-sm text-muted">Nenhuma planta encontrada.</p>}
    </div>
  );
}

/** `PlantasLista` num sheet com "Pronto". */
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
  const [sel, setSel] = useState(selecionadas);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <Button block disabled={!sel.length} onClick={() => onConfirmar(sel)}>
          Pronto{sel.length ? ` (${sel.length})` : ''}
        </Button>
      }
    >
      <PlantasLista selecionadas={sel} onChange={setSel} />
    </Sheet>
  );
}
