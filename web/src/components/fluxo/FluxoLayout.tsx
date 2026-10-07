import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui';

/** Tela de uma etapa: cabeçalho com voltar, barra de progresso (fora de desvios) e botão principal fixo embaixo. */
export function FluxoLayout({
  titulo,
  progresso,
  rodape,
  children,
}: {
  titulo: string;
  progresso?: { etapas: readonly string[]; atual: string };
  rodape: ReactNode;
  children: ReactNode;
}) {
  const passo = progresso ? progresso.etapas.indexOf(progresso.atual) : -1;
  const total = progresso?.etapas.length ?? 0;
  return (
    <div className="min-h-dvh pb-36">
      <PageHeader title={titulo} back />
      {passo >= 0 && total > 1 && (
        <div className="mx-auto flex max-w-2xl gap-1.5 px-4 pt-3" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={passo + 1} aria-label={`Etapa ${passo + 1} de ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-primary' : 'bg-line'}`} />
          ))}
        </div>
      )}
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4">{children}</div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto mb-3 max-w-2xl space-y-2">{rodape}</div>
      </div>
    </div>
  );
}
