import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10 pt-safe">
      <div className="mx-auto w-full max-w-sm">
        <img src="/icon.svg" alt="" className="mb-6 size-14" />
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1.5 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email.trim(), senha);
      navigate('/', { replace: true });
    } catch (error) {
      setErro(errorMessage(error, 'E-mail ou senha inválidos.'));
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Bonsai Manager" subtitle="Seu caderno de cuidados, sempre à mão.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Field>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <Button type="submit" block loading={loading}>
          Entrar
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-primary">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await register(nome.trim(), email.trim(), senha);
      navigate('/', { replace: true });
    } catch (error) {
      setErro(errorMessage(error, 'Não foi possível criar a conta.'));
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece a acompanhar suas plantas.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome">
          <input className="input" autoComplete="name" required minLength={3} value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </Field>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        <Button type="submit" block loading={loading}>
          Criar conta
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
