import { Field } from '@/components/ui';
import { plantaTitulo } from '@/lib/format';
import { useAtividadesOrdenadas, usePlantas } from '@/lib/queries';

/** Um cuidado só (registrar) ou vários de uma vez (agendar). */
type Selecao =
  | { multiplo?: false; atividadeId: string; onAtividade: (id: string) => void }
  | { multiplo: true; atividadeIds: string[]; onAtividades: (ids: string[]) => void };

/** Seleção de planta (quando não vem pré-selecionada) + chips de tipo de cuidado. */
export function PlantaAtividadeFields({
  plantaId,
  onPlanta,
  lockPlanta,
  ...selecao
}: {
  plantaId: string;
  onPlanta: (id: string) => void;
  lockPlanta?: boolean;
} & Selecao) {
  const plantas = usePlantas();
  const atividades = useAtividadesOrdenadas();

  const ativa = (id: string) => (selecao.multiplo ? selecao.atividadeIds.includes(id) : selecao.atividadeId === id);
  function tocar(id: string) {
    if (!selecao.multiplo) return selecao.onAtividade(id);
    const { atividadeIds, onAtividades } = selecao;
    onAtividades(atividadeIds.includes(id) ? atividadeIds.filter((a) => a !== id) : [...atividadeIds, id]);
  }

  return (
    <>
      {!lockPlanta && (
        <Field label="Planta">
          <select className="input" value={plantaId} onChange={(e) => onPlanta(e.target.value)} required>
            <option value="" disabled>
              {plantas.isLoading ? 'Carregando…' : 'Escolha a planta'}
            </option>
            {plantas.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {plantaTitulo(p)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div>
        <span className="label">
          {selecao.multiplo ? 'Tipos de cuidado' : 'Tipo de cuidado'}
          {selecao.multiplo && <span className="font-normal text-muted"> · toque em quantos quiser</span>}
        </span>
        {atividades.isLoading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : atividades.data.length === 0 ? (
          <p className="text-sm text-muted">Nenhum tipo de cuidado cadastrado ainda (o admin cadastra em Perfil → Admin).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {atividades.data.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => tocar(a.id)}
                className={`chip ${ativa(a.id) ? 'chip-active' : ''}`}
                aria-pressed={ativa(a.id)}
              >
                {a.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
