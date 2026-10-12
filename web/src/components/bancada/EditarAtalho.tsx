import { useState } from 'react';
import { Button, Field } from '@/components/ui';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { AtividadeChips } from '@/components/care/AtividadeChips';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { apagarAtalho, atividadesValidas, opcoesEspecies, plantasDoAtalho, salvarAtalho, type Atalho } from '@/lib/atalhos';
import { useAtividades, useNomeEspecie, usePlantas, useSalvarAtalhos } from '@/lib/queries';
import { GRUPOS_PLANTA, type GrupoPlanta } from '@/types';

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Criar (sem `atalho`) ou editar um atalho: nome, atividades, grupos, espécies, descrição e prévia de quantas plantas pega. */
export function EditarAtalho({ open, atalho, onClose }: { open: boolean; atalho?: Atalho; onClose: () => void }) {
  const toast = useToast();
  const plantas = usePlantas();
  const atividades = useAtividades();
  const salvarLista = useSalvarAtalhos();
  const [novoId] = useState(() => crypto.randomUUID());
  const [atividadeIds, setAtividadeIds] = useState(atalho?.atividadeIds ?? []);
  const [grupos, setGrupos] = useState<GrupoPlanta[]>(atalho?.grupos ?? []);
  const [especieIds, setEspecieIds] = useState(atalho?.especieIds ?? []);
  const [nome, setNome] = useState(atalho?.nome ?? '');
  const [detalhes, setDetalhes] = useState(atalho?.detalhes ?? '');
  const [salvando, setSalvando] = useState(false);
  const [apagar, setApagar] = useState(false);

  const todas = plantas.data ?? [];
  const rascunho: Atalho = {
    id: atalho?.id ?? novoId,
    atividadeIds,
    grupos,
    especieIds,
    ...(nome.trim() ? { nome: nome.trim() } : {}),
    ...(detalhes.trim() ? { detalhes: detalhes.trim() } : {}),
  };
  const nomeEspecie = useNomeEspecie([rascunho]);
  const quantas = plantasDoAtalho(rascunho, todas).length;
  const nomesAtividades = atividadesValidas(rascunho, atividades.data ?? []).map((a) => a.nome).join(' + ');

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
          <Field label="Nome" hint="Opcional · sem nome, o atalho mostra as atividades">
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={nomesAtividades || 'Ex.: Rega da manhã'}
            />
          </Field>
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
          <Field label="Descrição / obs." hint="Vai para o cuidado toda vez que o atalho for usado">
            <textarea className="input min-h-16" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Ex.: adubo Bioplant, 1 tampa por litro" />
          </Field>
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
