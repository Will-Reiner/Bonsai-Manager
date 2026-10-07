import { useEffect, useRef } from 'react';
import { Check, Delete } from 'lucide-react';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Teclado numérico fixo (não usa o teclado do sistema, que abre/fecha e empurra o layout).
 * Também aceita teclado físico: dígitos, Backspace e Enter.
 */
export function NumericKeypad({
  value,
  onChange,
  onConfirm,
  confirmDisabled,
  maxLength = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  maxLength?: number;
}) {
  const digitar = (d: string) => value.length < maxLength && onChange(value + d);
  const apagar = () => onChange(value.slice(0, -1));
  const confirmar = () => !confirmDisabled && onConfirm();

  // Ref com as ações atuais, para o listener de teclado não precisar ser re-registrado a cada tecla
  const acoes = useRef({ digitar, apagar, confirmar });
  useEffect(() => {
    acoes.current = { digitar, apagar, confirmar };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) acoes.current.digitar(e.key);
      else if (e.key === 'Backspace') acoes.current.apagar();
      else if (e.key === 'Enter') acoes.current.confirmar();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tecla =
    'flex h-14 select-none items-center justify-center rounded-xl text-2xl font-semibold transition active:scale-95';

  return (
    <div className="grid grid-cols-3 gap-2">
      {TECLAS.map((d) => (
        <button key={d} type="button" onClick={() => digitar(d)} className={`${tecla} bg-card text-ink active:bg-primary-light`}>
          {d}
        </button>
      ))}
      <button type="button" onClick={apagar} className={`${tecla} bg-card/60 text-muted`} aria-label="Apagar">
        <Delete size={24} />
      </button>
      <button type="button" onClick={() => digitar('0')} className={`${tecla} bg-card text-ink active:bg-primary-light`}>
        0
      </button>
      <button
        type="button"
        onClick={confirmar}
        disabled={confirmDisabled}
        className={`${tecla} bg-primary text-white disabled:bg-primary/40`}
        aria-label="Confirmar"
      >
        <Check size={28} />
      </button>
    </div>
  );
}
