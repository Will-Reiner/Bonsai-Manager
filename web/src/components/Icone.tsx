import type { CSSProperties } from 'react';
import { urlIcone, type NomeIcone } from '@/lib/icones';

/** Ícone próprio (traço sumi). Decorativo: o nome acessível fica no botão/link que o contém. */
export function Icone({
  nome,
  ativo = false,
  size = 22,
  className = '',
}: {
  nome: NomeIcone;
  ativo?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`icone ${className}`}
      style={{ width: size, height: size, '--icone': `url(${urlIcone(nome, ativo)})` } as CSSProperties}
    />
  );
}
