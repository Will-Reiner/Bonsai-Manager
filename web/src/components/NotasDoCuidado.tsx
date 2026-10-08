import type { NotaCuidado } from '@/lib/linhaDoTempo';

/** Descrições e obs. de um cuidado do dia; com o nome da tarefa quando o texto não vale para todas. */
export function NotasDoCuidado({ notas }: { notas: NotaCuidado[] }) {
  if (!notas.length) return null;
  return (
    <div className="mt-0.5 space-y-1">
      {notas.map((n) => {
        const rotulo = n.atividades?.join(', ');
        return n.tipo === 'obs' ? (
          <p key={`o-${rotulo}-${n.texto}`} className="whitespace-pre-line text-sm text-accent">
            Próxima vez{rotulo ? ` (${rotulo})` : ''}: {n.texto}
          </p>
        ) : (
          <p key={`d-${rotulo}-${n.texto}`} className="whitespace-pre-line text-sm">
            {rotulo && <span className="font-semibold">{rotulo}: </span>}
            {n.texto}
          </p>
        );
      })}
    </div>
  );
}
