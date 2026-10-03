import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2, Sprout } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50',
  secondary: 'bg-primary-light text-primary-dark hover:bg-primary-light/70',
  ghost: 'bg-transparent text-primary hover:bg-primary-light',
  danger: 'bg-danger-light text-danger hover:bg-danger-light/70',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  block?: boolean;
  size?: 'md' | 'sm';
}

export function Button({
  variant = 'primary',
  loading,
  block,
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${
        size === 'md' ? 'min-h-12 px-5 text-[15px]' : 'min-h-9 px-3.5 text-sm'
      } ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-sm py-12 text-center">
      <p className="text-sm text-danger">{text}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon ?? <Sprout size={26} />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1.5 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Cabeçalho de tela. `back` mostra a seta de voltar. */
export function PageHeader({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 pt-safe backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        {back && (
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-primary-dark hover:bg-primary-light"
            aria-label="Voltar"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="flex-1 truncate text-xl font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function Avatar({ url, nome, size = 48 }: { url?: string | null; nome?: string; size?: number }) {
  const iniciais = (nome || '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return url ? (
    <img src={url} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-accent-light font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {iniciais}
    </div>
  );
}

/** Foto de capa da planta, com placeholder quando não houver. */
export function PlantThumb({ url, className = '' }: { url?: string | null; className?: string }) {
  return url ? (
    <img src={url} alt="" loading="lazy" className={`bg-primary-light object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-primary-light text-primary/60 ${className}`}>
      <Sprout size={28} />
    </div>
  );
}

export function SectionTitle({ children, tone }: { children: ReactNode; tone?: 'danger' }) {
  return (
    <h2
      className={`mb-2.5 mt-6 font-sans text-xs font-semibold uppercase tracking-wider ${
        tone === 'danger' ? 'text-danger' : 'text-muted'
      }`}
    >
      {children}
    </h2>
  );
}
