import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Icone } from '@/components/Icone';

type ToastKind = 'success' | 'error' | 'celebra';
const DURACAO: Record<ToastKind, number> = { success: 3200, error: 3200, celebra: 1700 };
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastContext = createContext<((text: string, kind?: ToastKind) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    // Uma celebração nova substitui a anterior em vez de empilhar
    setToasts((list) => [...(kind === 'celebra' ? list.filter((t) => t.kind !== 'celebra') : list), { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), DURACAO[kind]);
  }, []);
  const fechar = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  const celebracao = toasts.find((t) => t.kind === 'celebra');
  const avisos = toasts.filter((t) => t.kind !== 'celebra');

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-safe"
      >
        {avisos.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-in mt-3 flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === 'success' ? 'bg-primary-dark' : 'bg-danger'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {t.text}
          </div>
        ))}
        {celebracao && <span className="sr-only">{celebracao.text}</span>}
      </div>
      {celebracao && (
        <div
          aria-hidden
          onClick={() => fechar(celebracao.id)}
          className="animate-fade-in fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg/90 px-8 text-center"
        >
          <span className="relative size-36">
            <img src="/arte/enso.webp" alt="" className="enso-uma-vez size-full" />
            <Icone nome="registrar" size={40} className="enso-icone absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" />
          </span>
          <p className="mt-4 font-display text-2xl font-semibold italic text-primary-dark">{celebracao.text}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}
