import { useState } from 'react';
import { ChevronRight, Plus, Zap } from 'lucide-react';
import { AtividadeIcone } from '@/components/AtividadeIcone';
import { BotaoTopo } from '@/components/Preferencias';
import { Sheet } from '@/components/Sheet';
import { Spinner } from '@/components/ui';
import { atividadesValidas, plantasDoAtalho, rotuloAlvo, type Atalho } from '@/lib/atalhos';
import { useAtalhos, useAtividades, useNomeEspecie, usePlantas, usePreferencias } from '@/lib/queries';
import { ConfirmarAtalho } from './ConfirmarAtalho';
import { EditarAtalho } from './EditarAtalho';

/**
 * Acesso rápido da Bancada: botão do topo que abre a lista de atalhos. Tocar num atalho confirma e registra;
 * "Criar atalho" cria. Atalho sem atividade válida abre a edição.
 */
export function AcessoRapido() {
  const atalhos = useAtalhos();
  const prefs = usePreferencias();
  const plantas = usePlantas();
  const atividades = useAtividades();
  const nomeEspecie = useNomeEspecie(atalhos);
  const [confirmar, setConfirmar] = useState<Atalho | null>(null);
  const [editar, setEditar] = useState<{ atalho?: Atalho } | null>(null);
  const [aberto, setAberto] = useState(false);

  // Sem preferências e atividades a lista mentiria ("Criar atalho", "Atividade removida"): espera as duas
  const pronto = !!prefs.data && !!atividades.data;
  const todas = plantas.data ?? [];
  const cards = atalhos.map((a) => ({
    atalho: a,
    validas: atividadesValidas(a, atividades.data ?? []),
    n: plantasDoAtalho(a, todas).length,
  }));

  /** Fecha a lista e abre a próxima gaveta (uma de cada vez). */
  const seguir = (fn: () => void) => {
    setAberto(false);
    fn();
  };

  return (
    <>
      <BotaoTopo label="Acesso rápido" onClick={() => setAberto(true)}>
        <Zap size={20} />
      </BotaoTopo>
      <Sheet open={aberto} onClose={() => setAberto(false)} title="Acesso rápido">
        {!pronto ? (
          <Spinner />
        ) : (
          <div className="space-y-2 pb-safe">
            {cards.map(({ atalho, validas, n }) => (
              <button
                key={atalho.id}
                type="button"
                onClick={() => seguir(() => (validas.length ? setConfirmar(atalho) : setEditar({ atalho })))}
                className={`card flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99] ${validas.length ? '' : 'opacity-60'}`}
              >
                <AtividadeIcone nome={validas[0]?.nome ?? ''} className="size-10" size={18} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {validas.length ? validas.map((v) => v.nome).join(' + ') : 'Atividade removida'}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {rotuloAlvo(atalho, nomeEspecie)} · <span className="font-medium text-primary">{n === 1 ? '1 planta' : `${n} plantas`}</span>
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => seguir(() => setEditar({}))}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line p-4 text-center text-sm font-semibold text-primary transition active:scale-[0.99]"
            >
              <Plus size={20} />
              Criar atalho
              {!cards.length && <span className="text-xs font-normal text-muted">Registre um cuidado em várias plantas com 2 toques</span>}
            </button>
          </div>
        )}
      </Sheet>
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
    </>
  );
}
