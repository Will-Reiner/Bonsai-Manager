import { Link } from 'react-router';
import { Repeat } from 'lucide-react';
import { NotasDoCuidado } from '@/components/NotasDoCuidado';
import { Roda } from '@/components/Roda';
import { textoIntervalo } from '@/lib/cuidados';
import type { Cuidado } from '@/lib/cuidadoDoDia';
import { dataLonga, distanciaRelativa } from '@/lib/format';
import { tituloCuidado } from '@/lib/linhaDoTempo';

/** Um cuidado do dia: título, quando, rotina, notas e fotos. */
export function PainelCuidado({ cuidado }: { cuidado: Cuidado }) {
  const deRotina = cuidado.agendas.filter((a) => a.rotina);
  const plantaId = cuidado.agendas[0].plantaId;

  return (
    <section className="px-4">
      <h2 className="font-display text-2xl font-semibold leading-tight">{tituloCuidado(cuidado.agendas)}</h2>
      <p className="mt-1 text-sm text-muted">
        Concluído · {distanciaRelativa(cuidado.data).toLowerCase()} ({dataLonga(cuidado.data)})
      </p>
      {deRotina.map((a) => (
        <p key={a.id} className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Repeat size={14} /> {deRotina.length > 1 ? `${a.atividade?.nome ?? 'Cuidado'}: ` : 'Rotina '}
          {textoIntervalo(a.rotina!.intervaloDias)}
          {a.rotina!.pausada && ' · pausada'}
        </p>
      ))}
      <div className="mt-3">
        <NotasDoCuidado notas={cuidado.notas} />
      </div>
      {cuidado.fotos.length > 0 && (
        <>
          <h3 className="mb-2.5 mt-6 text-xs font-semibold uppercase tracking-wider text-muted">Fotos · {cuidado.fotos.length}</h3>
          <Roda label="Fotos do cuidado">
            {cuidado.fotos.map((f) => (
              <Link key={f.id} to={`/plantas/${plantaId}/galeria?foto=${f.id}`} className="block">
                <img src={f.caminhoArquivo} alt="" loading="lazy" className="aspect-square w-full rounded-2xl bg-primary-light object-cover" />
              </Link>
            ))}
          </Roda>
        </>
      )}
    </section>
  );
}
