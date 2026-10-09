import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { atividadesValidas, nomesDeEspecies, plantasDoAtalho, rotuloAlvo, type Atalho } from '@/lib/atalhos';
import { useAtalhos, useAtividades, useEspecies, usePlantas } from '@/lib/queries';
import { ConfirmarAtalho } from './ConfirmarAtalho';
import { EditarAtalho } from './EditarAtalho';

/** Faixa de atalhos da Bancada: tocar confirma e registra; "＋" cria. Atalho sem atividade válida abre a edição. */
export function AcessoRapido() {
  const atalhos = useAtalhos();
  const plantas = usePlantas();
  const atividades = useAtividades();
  const especies = useEspecies();
  const [confirmar, setConfirmar] = useState<Atalho | null>(null);
  const [editar, setEditar] = useState<{ atalho?: Atalho } | null>(null);

  const todas = plantas.data ?? [];
  const nomeEspecie = nomesDeEspecies(todas, especies.data ?? []);
  const cards = atalhos.map((a) => ({
    atalho: a,
    validas: atividadesValidas(a, atividades.data ?? []),
    n: plantasDoAtalho(a, todas).length,
  }));

  return (
    <section className="pb-3">
      <h2 className="label">Acesso rápido</h2>
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {cards.map(({ atalho, validas, n }) => (
          <button
            key={atalho.id}
            type="button"
            onClick={() => (validas.length ? setConfirmar(atalho) : setEditar({ atalho }))}
            className={`card flex w-40 shrink-0 snap-start flex-col gap-1.5 p-3 text-left transition active:scale-[0.97] ${validas.length ? '' : 'opacity-60'}`}
          >
            <AtividadeIcone nome={validas[0]?.nome ?? ''} className="size-8" size={16} />
            <span className="line-clamp-2 text-sm font-semibold leading-tight">
              {validas.length ? validas.map((v) => v.nome).join(' + ') : 'Atividade removida'}
            </span>
            <span className="truncate text-xs text-muted">{rotuloAlvo(atalho, nomeEspecie)}</span>
            <span className="text-xs font-medium text-primary">{n === 1 ? '1 planta' : `${n} plantas`}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setEditar({})}
          className={`flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line p-3 text-center text-sm font-semibold text-primary transition active:scale-[0.97] ${cards.length ? 'w-24' : 'w-full'}`}
        >
          <Plus size={20} />
          {cards.length ? (
            'Atalho'
          ) : (
            <>
              Criar atalho
              <span className="text-xs font-normal text-muted">Registre um cuidado em várias plantas com 2 toques</span>
            </>
          )}
        </button>
      </div>
      {confirmar && (
        <ConfirmarAtalho
          key={confirmar.id}
          atalho={confirmar}
          onClose={() => setConfirmar(null)}
          onEditar={() => {
            setEditar({ atalho: confirmar });
            setConfirmar(null);
          }}
        />
      )}
      {editar && <EditarAtalho key={editar.atalho?.id ?? 'novo'} open atalho={editar.atalho} onClose={() => setEditar(null)} />}
    </section>
  );
}
