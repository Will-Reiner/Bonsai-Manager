import { useAtividadesOrdenadas } from '@/lib/queries';

/** Chips de tipo de cuidado, múltipla escolha. */
export function AtividadeChips({
  value,
  onChange,
  label = 'Tipos de cuidado',
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const atividades = useAtividadesOrdenadas();
  const tocar = (id: string) => onChange(value.includes(id) ? value.filter((a) => a !== id) : [...value, id]);

  return (
    <div>
      <span className="label">
        {label} <span className="font-normal text-muted">· toque em quantos quiser</span>
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
              className={`chip ${value.includes(a.id) ? 'chip-active' : ''}`}
              aria-pressed={value.includes(a.id)}
            >
              {a.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
