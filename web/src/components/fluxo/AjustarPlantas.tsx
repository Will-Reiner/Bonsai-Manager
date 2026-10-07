import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface PlantaAjuste {
  id: string;
  thumb: ReactNode;
  titulo: string;
  subtitulo?: string;
  ajustado: boolean;
}

/** Lista de plantas para ajustar uma a uma — o que não for mudado segue o geral. */
export function AjustarPlantas({ itens, conteudo }: { itens: PlantaAjuste[]; conteudo: (id: string) => ReactNode }) {
  const [aberta, setAberta] = useState<string | null>(null);
  return (
    <section>
      <p className="mb-3 text-sm text-muted">Toque numa planta para mudar só nela. O que não for mudado segue o geral.</p>
      <div className="space-y-2">
        {itens.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setAberta(aberta === p.id ? null : p.id)}
              className="flex w-full items-center gap-3 p-2.5 text-left"
              aria-expanded={aberta === p.id}
            >
              {p.thumb}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.titulo}</span>
                {p.subtitulo && <span className="block truncate text-xs text-muted">{p.subtitulo}</span>}
                {p.ajustado && <span className="text-xs font-medium text-primary">Com ajuste próprio</span>}
              </span>
              <ChevronDown size={20} className={`shrink-0 text-muted transition ${aberta === p.id ? 'rotate-180' : ''}`} />
            </button>
            {aberta === p.id && <div className="space-y-3 border-t border-line p-3">{conteudo(p.id)}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
