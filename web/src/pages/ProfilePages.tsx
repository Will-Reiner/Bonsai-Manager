import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LogOut, MapPin, Pencil, ShieldCheck } from 'lucide-react';
import { Avatar, Button, Field, PageHeader } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { authApi, preferenciasApi } from '@/lib/endpoints';
import { keys, useAgendas, usePreferencias, useRevisaoDias, useTransplanteDias, usePreTransplanteDias, usePlantas } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';

const OPCOES_REVISAO = [
  { valor: '0', label: 'Desligada' },
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '60', label: '60 dias' },
  { valor: '90', label: '90 dias' },
];

const OPCOES_PRE_TRANSPLANTE = [
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '45', label: '45 dias' },
  { valor: '60', label: '60 dias' },
];

const OPCOES_TRANSPLANTE = [
  { valor: '7', label: '7 dias' },
  { valor: '15', label: '15 dias' },
  { valor: '30', label: '30 dias' },
  { valor: '45', label: '45 dias' },
  { valor: '60', label: '60 dias' },
];

/** Preferência numérica (dias) escolhida numa lista. */
function PreferenciaDias({
  chave,
  dias,
  opcoes,
  label,
  hint,
}: {
  chave: string;
  dias: number;
  opcoes: { valor: string; label: string }[];
  label: string;
  hint: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefs = usePreferencias();
  const [salvando, setSalvando] = useState(false);

  async function mudar(valor: string) {
    setSalvando(true);
    try {
      await preferenciasApi.set(chave, valor);
      await queryClient.invalidateQueries({ queryKey: keys.preferencias });
      toast('Preferência salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="card mt-4 p-4">
      <Field label={label} hint={hint}>
        <select className="input" value={String(dias)} disabled={prefs.isLoading || salvando} onChange={(e) => mudar(e.target.value)}>
          {!opcoes.some((o) => o.valor === String(dias)) && <option value={String(dias)}>{dias} dias</option>}
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}

/** Intervalo da rotina de Revisão geral criada em cada planta nova. */
function RevisaoAutomatica() {
  return (
    <PreferenciaDias
      chave="revisao_automatica_dias"
      dias={useRevisaoDias()}
      opcoes={OPCOES_REVISAO}
      label="Revisão geral das plantas novas"
      hint="Cada planta nova ganha uma rotina de Revisão geral com este intervalo, remarcada a cada cuidado. Para mudar numa planta, use a seção Rotinas dela."
    />
  );
}

/** Quanto tempo a planta fica em Recém transplantada depois de um Transplante. */
function TempoTransplante() {
  return (
    <PreferenciaDias
      chave="transplante_dias"
      dias={useTransplanteDias()}
      opcoes={OPCOES_TRANSPLANTE}
      label="Dias em Recém transplantada"
      hint="Ao registrar um Transplante, a planta vai para o grupo Recém transplantada por este tempo e depois volta ao grupo em que estava."
    />
  );
}

/** Quantos dias antes de um Transplante agendado a planta entra no Pré-transplante. */
function TempoPreTransplante() {
  return (
    <PreferenciaDias
      chave="pre_transplante_dias"
      dias={usePreTransplanteDias()}
      opcoes={OPCOES_PRE_TRANSPLANTE}
      label="Dias de Pré-transplante"
      hint="Com um Transplante agendado, a planta entra no grupo Pré-transplante este tempo antes da data. Feito o transplante, vai para Recém transplantada."
    />
  );
}

export function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const me = useQuery({ queryKey: keys.me, queryFn: authApi.me });
  const plantas = usePlantas();
  const agendas = useAgendas();
  const perfil = me.data ?? user;

  const concluidas = agendas.data?.filter((a) => a.status === 'CONCLUIDO').length ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="pb-2 pt-6">
        <h1 className="text-3xl font-semibold">Perfil</h1>
      </header>

      <section className="card mt-3 p-5">
        <div className="flex items-center gap-4">
          <Avatar url={perfil?.fotoPerfilUrl} nome={perfil?.nome} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{perfil?.nomePublico || perfil?.nome}</p>
            <p className="truncate text-sm text-muted">{perfil?.email}</p>
            {perfil?.localidade && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> {perfil.localidade}
              </p>
            )}
          </div>
        </div>
        {perfil?.bio && <p className="mt-4 whitespace-pre-line text-sm">{perfil.bio}</p>}
        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Numero label="Plantas" valor={plantas.data?.length ?? 0} />
          <Numero label="Cuidados" valor={concluidas} />
          <Numero label="Seguidores" valor={me.data?.seguidores?.length ?? 0} />
        </dl>
      </section>

      <RevisaoAutomatica />
      <TempoPreTransplante />
      <TempoTransplante />

      <nav className="card mt-4 divide-y divide-line overflow-hidden">
        <MenuItem to="/perfil/editar" icon={<Pencil size={20} />} label="Editar perfil" />
        {isAdmin && <MenuItem to="/admin" icon={<ShieldCheck size={20} />} label="Painel admin" />}
        <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-4 text-left font-medium text-danger">
          <LogOut size={20} /> Sair
        </button>
      </nav>
    </div>
  );
}

function Numero({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-xl bg-bg py-2.5">
      <dd className="font-display text-xl font-semibold text-primary-dark">{valor}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

function MenuItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-4 font-medium">
      <span className="text-primary">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}

export function EditProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [nome, setNome] = useState(user?.nome ?? '');
  const [nomePublico, setNomePublico] = useState(user?.nomePublico ?? '');
  const [localidade, setLocalidade] = useState(user?.localidade ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [perfilPublico, setPerfilPublico] = useState(user?.perfilPublico ?? true);
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const fotoPerfilUrl = foto ? await uploadImage(foto) : undefined;
      const atualizado = await authApi.updateMe({
        nome: nome.trim(),
        nomePublico: nomePublico.trim(),
        localidade: localidade.trim(),
        bio: bio.trim(),
        perfilPublico,
        ...(fotoPerfilUrl ? { fotoPerfilUrl } : {}),
      });
      setUser(atualizado);
      toast('Perfil atualizado');
      navigate('/perfil', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader title="Editar perfil" back />
      <form onSubmit={salvar} className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        <div className="mx-auto w-36">
          <PhotoInput file={foto} onChange={setFoto} currentUrl={user?.fotoPerfilUrl} label="Foto" aspect="aspect-square" />
        </div>
        <Field label="Nome">
          <input className="input" required minLength={3} value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="Nome público" hint="Como aparece para outras pessoas">
          <input className="input" value={nomePublico} onChange={(e) => setNomePublico(e.target.value)} />
        </Field>
        <Field label="Cidade / região">
          <input className="input" value={localidade} onChange={(e) => setLocalidade(e.target.value)} />
        </Field>
        <Field label="Bio">
          <textarea className="input min-h-24" value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <label className="card flex items-center justify-between gap-4 p-4">
          <span>
            <span className="block font-medium">Perfil público</span>
            <span className="block text-sm text-muted">Outras pessoas podem ver seu perfil</span>
          </span>
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={perfilPublico}
            onChange={(e) => setPerfilPublico(e.target.checked)}
          />
        </label>
        <Button type="submit" block loading={salvando}>
          Salvar
        </Button>
      </form>
    </div>
  );
}
