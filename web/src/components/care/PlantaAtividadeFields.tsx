import { Field } from '@/components/ui';
import { plantaTitulo } from '@/lib/format';
import { useAtividadesOrdenadas, usePlantas } from '@/lib/queries';

/** Seleção de planta (quando não vem pré-selecionada) + chips de tipo de cuidado. */
export function PlantaAtividadeFields({
  plantaId,
  onPlanta,
  atividadeId,
  onAtividade,
  lockPlanta,
}: {
  plantaId: string;
  onPlanta: (id: string) => void;
  atividadeId: string;
  onAtividade: (id: string) => void;
  lockPlanta?: boolean;
}) {
  const plantas = usePlantas();
  const atividades = useAtividadesOrdenadas();

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
        <span className="label">Tipo de cuidado</span>
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
                onClick={() => onAtividade(a.id)}
                className={`chip ${atividadeId === a.id ? 'chip-active' : ''}`}
                aria-pressed={atividadeId === a.id}
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
