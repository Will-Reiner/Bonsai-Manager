import { Icone } from '@/components/Icone';
import { iconeDaAtividade } from '@/lib/icones';
import { useAtividadesOrdenadas } from '@/lib/queries';

/** Atividades em grade de ícones sumi, múltipla escolha; marcada = mancha de tinta. */
export function AtividadeChips({
  value,
  onChange,
  label = 'Tipos de cuidado',
  dica,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  /** Texto curto ao lado do nome (ex.: "há 12 dias"). */
  dica?: (atividadeId: string) => string | undefined;
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
        <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
          {atividades.data.map((a) => {
            const marcado = value.includes(a.id);
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => tocar(a.id)}
                aria-pressed={marcado}
                className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight text-ink transition active:scale-95"
              >
                <span className={`mancha flex size-12 items-center justify-center ${marcado ? 'mancha-on text-bg' : ''}`}>
                  <Icone nome={iconeDaAtividade(a.nome)} size={22} />
                </span>
                <span className={marcado ? 'font-semibold' : ''}>{a.nome}</span>
                {dica?.(a.id) && <span className="text-[10px] text-muted">{dica(a.id)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
