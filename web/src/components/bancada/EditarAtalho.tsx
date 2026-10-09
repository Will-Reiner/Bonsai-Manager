import { useState } from 'react';
import { Button } from '@/components/ui';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { apagarAtalho, opcoesEspecies, plantasDoAtalho, salvarAtalho, type Atalho } from '@/lib/atalhos';
import { useNomeEspecie, usePlantas, useSalvarAtalhos } from '@/lib/queries';
import { GRUPOS_PLANTA, type GrupoPlanta } from '@/types';

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Criar (sem `atalho`) ou editar um atalho: atividades, grupos, espécies e prévia de quantas plantas pega. */
export function EditarAtalho({ open, atalho, onClose }: { open: boolean; atalho?: Atalho; onClose: () => void }) {
  const toast = useToast();
  const plantas = usePlantas();
  const salvarLista = useSalvarAtalhos();
  const [novoId] = useState(() => crypto.randomUUID());
  const [atividadeIds, setAtividadeIds] = useState(atalho?.atividadeIds ?? []);
  const [grupos, setGrupos] = useState<GrupoPlanta[]>(atalho?.grupos ?? []);
  const [especieIds, setEspecieIds] = useState(atalho?.especieIds ?? []);
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(false);

  const todas = plantas.data ?? [];
  const rascunho: Atalho = { id: atalho?.id ?? novoId, atividadeIds, grupos, especieIds };
  const nomeEspecie = useNomeEspecie([rascunho]);
  const quantas = plantasDoAtalho(rascunho, todas).length;

  async function gravar(mudar: (lista: Atalho[]) => Atalho[], msg: string) {
    setSalvando(true);
    try {
      await salvarLista(mudar);
      toast(msg);
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  return (
    <>
      <Sheet
        open={open && !apagar}
        onClose={onClose}
        title={atalho ? 'Editar atalho' : 'Novo atalho'}
        footer={
          <>
            <Button
              block
              disabled={!atividadeIds.length}
              loading={salvando}
              onClick={() => gravar((l) => salvarAtalho(l, rascunho), 'Atalho salvo')}
            >
              Salvar
            </Button>
            {atalho && (
              <Button block variant="ghost" className="text-danger" onClick={() => setApagar(true)}>
                Apagar atalho
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          <AtividadeChips value={atividadeIds} onChange={setAtividadeIds} label="O que registrar" />
          <fieldset>
            <legend className="label">
              Grupos <span className="font-normal text-muted">· nenhum = todos</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {GRUPOS_PLANTA.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`chip ${grupos.includes(g.value) ? 'chip-active' : ''}`}
                  aria-pressed={grupos.includes(g.value)}
                  onClick={() => setGrupos((l) => alternar(l, g.value))}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">
              Espécies <span className="font-normal text-muted">· nenhuma = todas</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {opcoesEspecies(todas, especieIds, nomeEspecie).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`chip ${especieIds.includes(e.id) ? 'chip-active' : ''}`}
                  aria-pressed={especieIds.includes(e.id)}
                  onClick={() => setEspecieIds((l) => alternar(l, e.id))}
                >
                  {e.nome}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-sm font-medium text-primary">Vale para {quantas === 1 ? '1 planta' : `${quantas} plantas`} agora</p>
        </div>
      </Sheet>
      <ConfirmSheet
        open={open && apagar}
        onClose={() => setApagar(false)}
        onConfirm={() => atalho && gravar((l) => apagarAtalho(l, atalho.id), 'Atalho apagado')}
        title="Apagar atalho?"
        text="As plantas e o histórico não mudam."
        confirmLabel="Apagar"
        loading={salvando}
      />
    </>
  );
}
