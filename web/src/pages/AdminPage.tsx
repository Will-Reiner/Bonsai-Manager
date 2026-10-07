import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button, EmptyState, ErrorState, Field, PageHeader, Spinner } from '@/components/ui';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { atividadesApi, especiesApi, tiposRecursoApi, type EspecieInput } from '@/lib/endpoints';
import { especieNome } from '@/lib/format';
import { keys, useAtividades, useEspecies, useTiposRecurso } from '@/lib/queries';
import { TIPOS_PLANTA, type Atividade, type Especie, type TipoPlanta, type TipoRecurso } from '@/types';

const SECOES = ['Espécies', 'Atividades', 'Insumos'] as const;
type Secao = (typeof SECOES)[number];

export function AdminPage() {
  const [secao, setSecao] = useState<Secao>('Espécies');
  return (
    <div>
      <PageHeader title="Painel admin" back />
      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="mt-4 grid grid-cols-3 rounded-xl bg-line/60 p-1" role="tablist">
          {SECOES.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={secao === s}
              onClick={() => setSecao(s)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${secao === s ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
            >
              {s}
            </button>
          ))}
        </div>
        {secao === 'Espécies' && <EspeciesAdmin />}
        {secao === 'Atividades' && <AtividadesAdmin />}
        {secao === 'Insumos' && <TiposRecursoAdmin />}
      </div>
    </div>
  );
}

// ---------- Espécies ----------

const CAMPOS_TEXTO: { grupo: string; campos: [keyof Especie, string][] }[] = [
  {
    grupo: 'Botânica',
    campos: [['folhas', 'Folhas'], ['tronco', 'Tronco'], ['flores', 'Flores'], ['frutos', 'Frutos'], ['raizes', 'Raízes']],
  },
  {
    grupo: 'Cultivo',
    campos: [['luminosidade', 'Luminosidade'], ['rega', 'Rega'], ['substratoIdeal', 'Substrato ideal'], ['adubacao', 'Adubação'], ['clima', 'Clima']],
  },
  {
    grupo: 'Conhecimento',
    campos: [
      ['problemasComuns', 'Problemas comuns'],
      ['pros', 'Prós'],
      ['contras', 'Contras'],
      ['linhasDeRaciocinio', 'Linhas de raciocínio'],
      ['observacoes', 'Observações'],
    ],
  },
];

function EspeciesAdmin() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filtro, setFiltro] = useState<'sugeridas' | 'todas'>('sugeridas');
  const sugeridas = useQuery({ queryKey: keys.especiesSugeridas, queryFn: especiesApi.sugeridas });
  const todas = useEspecies();
  const [editando, setEditando] = useState<Especie | 'nova' | null>(null);

  const query = filtro === 'sugeridas' ? sugeridas : todas;
  const invalidar = () => queryClient.invalidateQueries({ queryKey: keys.especies });

  async function aprovar(e: Especie) {
    try {
      await especiesApi.update(e.id, { status: 'VERIFICADO' });
      invalidar();
      toast(`${especieNome(e)} verificada`);
    } catch (error) {
      toast(errorMessage(error), 'error');
    }
  }

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center gap-2">
        <button className={`chip ${filtro === 'sugeridas' ? 'chip-active' : ''}`} onClick={() => setFiltro('sugeridas')}>
          Sugeridas{sugeridas.data ? ` · ${sugeridas.data.length}` : ''}
        </button>
        <button className={`chip ${filtro === 'todas' ? 'chip-active' : ''}`} onClick={() => setFiltro('todas')}>
          Todas
        </button>
        <Button size="sm" className="ml-auto" onClick={() => setEditando('nova')}>
          <Plus size={16} /> Nova
        </Button>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorState text={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data?.length === 0 ? (
        <EmptyState title={filtro === 'sugeridas' ? 'Nenhuma sugestão pendente' : 'Nenhuma espécie'} />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {query.data?.map((e) => (
            <div key={e.id} className="flex items-center gap-2 px-3 py-2.5">
              <button className="min-w-0 flex-1 py-1 text-left" onClick={() => setEditando(e)}>
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {especieNome(e)}
                  {e.status === 'VERIFICADO' && <BadgeCheck size={15} className="shrink-0 text-primary" />}
                </p>
                {e.nomeCientifico && <p className="truncate text-sm italic text-muted">{e.nomeCientifico}</p>}
              </button>
              {e.status === 'SUGERIDO' && (
                <Button size="sm" variant="secondary" onClick={() => aprovar(e)}>
                  <Check size={16} /> Aprovar
                </Button>
              )}
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </div>
          ))}
        </div>
      )}

      {editando && (
        <EspecieForm
          especie={editando === 'nova' ? null : editando}
          onClose={() => setEditando(null)}
          onSaved={() => {
            invalidar();
            setEditando(null);
          }}
        />
      )}
    </section>
  );
}

function EspecieForm({ especie, onClose, onSaved }: { especie: Especie | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    if (especie) for (const [k, val] of Object.entries(especie)) if (typeof val === 'string') v[k] = val;
    return v;
  });
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const set = (k: string) => (e: { target: { value: string } }) => setValores((v) => ({ ...v, [k]: e.target.value }));
  const val = (k: string) => valores[k] ?? '';

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const body: EspecieInput = {};
    const textos = ['nomeComum', 'familia', 'origem', ...CAMPOS_TEXTO.flatMap((g) => g.campos.map(([k]) => k))];
    for (const k of textos) {
      const v = val(k).trim();
      // Em edição, string vazia limpa o campo; na criação, campos vazios são omitidos
      if (v || especie?.[k as keyof Especie]) (body as Record<string, string>)[k] = v;
    }
    if (val('nomeCientifico').trim()) body.nomeCientifico = val('nomeCientifico').trim();
    if (val('tipoDePlanta')) body.tipoDePlanta = val('tipoDePlanta') as TipoPlanta;
    if (!especie) body.status = 'VERIFICADO';
    if (!body.nomeComum && !body.nomeCientifico) return toast('Informe o nome popular ou o científico.', 'error');

    setSalvando(true);
    try {
      if (especie) await especiesApi.update(especie.id, body);
      else await especiesApi.create(body);
      toast('Espécie salva');
      onSaved();
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!especie) return;
    setSalvando(true);
    try {
      await especiesApi.remove(especie.id);
      toast('Espécie excluída');
      onSaved();
    } catch (error) {
      toast(errorMessage(error, 'Não foi possível excluir (há plantas usando esta espécie?).'), 'error');
      setSalvando(false);
      setConfirmar(false);
    }
  }

  return (
    <>
      <Sheet open onClose={onClose} title={especie ? 'Editar espécie' : 'Nova espécie'}>
        <form onSubmit={salvar} className="space-y-4 pb-safe">
          <Field label="Nome popular">
            <input className="input" value={val('nomeComum')} onChange={set('nomeComum')} />
          </Field>
          <Field label="Nome científico">
            <input className="input italic" value={val('nomeCientifico')} onChange={set('nomeCientifico')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Família">
              <input className="input" value={val('familia')} onChange={set('familia')} />
            </Field>
            <Field label="Origem">
              <input className="input" value={val('origem')} onChange={set('origem')} />
            </Field>
          </div>
          <Field label="Tipo de planta">
            <select className="input" value={val('tipoDePlanta')} onChange={set('tipoDePlanta')}>
              <option value="">—</option>
              {TIPOS_PLANTA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          {CAMPOS_TEXTO.map((g) => (
            <details key={g.grupo} className="card group px-4 py-3">
              <summary className="cursor-pointer list-none font-semibold text-primary-dark">
                {g.grupo} <span className="text-sm font-normal text-muted group-open:hidden">· toque para abrir</span>
              </summary>
              <div className="mt-3 space-y-3">
                {g.campos.map(([k, label]) => (
                  <Field key={k} label={label}>
                    <textarea className="input min-h-20" value={val(k)} onChange={set(k)} />
                  </Field>
                ))}
              </div>
            </details>
          ))}
          <Button type="submit" block loading={salvando}>
            Salvar
          </Button>
          {especie && (
            <Button type="button" variant="danger" block onClick={() => setConfirmar(true)}>
              <Trash2 size={18} /> Excluir espécie
            </Button>
          )}
        </form>
      </Sheet>
      <ConfirmSheet open={confirmar} onClose={() => setConfirmar(false)} onConfirm={excluir} loading={salvando} title="Excluir espécie?" />
    </>
  );
}

// ---------- Atividades ----------

const CAMPOS_ATIVIDADE: [keyof Atividade, string][] = [
  ['descricao', 'Descrição'],
  ['objetivos', 'Objetivos'],
  ['preparacao', 'Preparação'],
  ['execucao', 'Execução'],
  ['cuidadosPosProcedimento', 'Cuidados pós-procedimento'],
];

function AtividadesAdmin() {
  const atividades = useAtividades();
  const [editando, setEditando] = useState<Atividade | 'nova' | null>(null);

  return (
    <section className="mt-4">
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setEditando('nova')}>
          <Plus size={16} /> Nova atividade
        </Button>
      </div>
      {atividades.isLoading ? (
        <Spinner />
      ) : atividades.data?.length === 0 ? (
        <EmptyState title="Nenhuma atividade" text="Rode o seed do servidor ou cadastre aqui (rega, adubação, poda…)." />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {atividades.data?.map((a) => (
            <button key={a.id} onClick={() => setEditando(a)} className="flex w-full items-center gap-2 px-4 py-3.5 text-left">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.nome}</span>
                {a.descricao && <span className="block truncate text-sm text-muted">{a.descricao}</span>}
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}
      {editando && <AtividadeForm atividade={editando === 'nova' ? null : editando} onClose={() => setEditando(null)} />}
    </section>
  );
}

function AtividadeForm({ atividade, onClose }: { atividade: Atividade | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [valores, setValores] = useState<Record<string, string>>(() => ({
    nome: atividade?.nome ?? '',
    ...Object.fromEntries(CAMPOS_ATIVIDADE.map(([k]) => [k, (atividade?.[k] as string | null) ?? ''])),
  }));
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const concluir = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: keys.atividades });
    toast(msg);
    onClose();
  };

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const body = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, v.trim()])) as { nome: string };
    try {
      if (atividade) await atividadesApi.update(atividade.id, body);
      else await atividadesApi.create(body);
      concluir('Atividade salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!atividade) return;
    setSalvando(true);
    try {
      await atividadesApi.remove(atividade.id);
      concluir('Atividade excluída');
    } catch (error) {
      toast(errorMessage(error, 'Não foi possível excluir (há tarefas usando esta atividade?).'), 'error');
      setSalvando(false);
      setConfirmar(false);
    }
  }

  return (
    <>
      <Sheet open onClose={onClose} title={atividade ? 'Editar atividade' : 'Nova atividade'}>
        <form onSubmit={salvar} className="space-y-4 pb-safe">
          <Field label="Nome">
            <input
              className="input"
              required
              minLength={3}
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </Field>
          {CAMPOS_ATIVIDADE.map(([k, label]) => (
            <Field key={k} label={label}>
              <textarea
                className="input min-h-20"
                value={valores[k]}
                onChange={(e) => setValores((v) => ({ ...v, [k]: e.target.value }))}
              />
            </Field>
          ))}
          <Button type="submit" block loading={salvando}>
            Salvar
          </Button>
          {atividade && (
            <Button type="button" variant="danger" block onClick={() => setConfirmar(true)}>
              <Trash2 size={18} /> Excluir atividade
            </Button>
          )}
        </form>
      </Sheet>
      <ConfirmSheet open={confirmar} onClose={() => setConfirmar(false)} onConfirm={excluir} loading={salvando} title="Excluir atividade?" />
    </>
  );
}

// ---------- Tipos de recurso (insumos) ----------

function TiposRecursoAdmin() {
  const tipos = useTiposRecurso();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [novo, setNovo] = useState('');
  const [editando, setEditando] = useState<TipoRecurso | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: keys.tiposRecurso });

  async function executar(acao: () => Promise<unknown>, msg: string) {
    setSalvando(true);
    try {
      await acao();
      invalidar();
      toast(msg);
      return true;
    } catch (error) {
      toast(errorMessage(error), 'error');
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    if (await executar(() => tiposRecursoApi.create(novo.trim()), 'Categoria adicionada')) setNovo('');
  }

  return (
    <section className="mt-4">
      <form onSubmit={adicionar} className="mb-3 flex gap-2">
        <input className="input" placeholder="Nova categoria (ex.: Adubo)" value={novo} minLength={2} required onChange={(e) => setNovo(e.target.value)} />
        <Button type="submit" loading={salvando && !editando} aria-label="Adicionar categoria">
          <Plus size={18} />
        </Button>
      </form>
      {tipos.isLoading ? (
        <Spinner />
      ) : tipos.data?.length === 0 ? (
        <EmptyState title="Nenhuma categoria de insumo" />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {tipos.data?.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setEditando(t);
                setNomeEdicao(t.nome);
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left font-medium"
            >
              {t.nome}
              <ChevronRight size={18} className="text-muted" />
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!editando && !confirmar} onClose={() => setEditando(null)} title="Editar categoria">
        <form
          className="space-y-4 pb-safe"
          onSubmit={async (e) => {
            e.preventDefault();
            if (editando && (await executar(() => tiposRecursoApi.update(editando.id, nomeEdicao.trim()), 'Categoria salva'))) setEditando(null);
          }}
        >
          <Field label="Nome">
            <input className="input" required minLength={2} value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} />
          </Field>
          <Button type="submit" block loading={salvando}>
            Salvar
          </Button>
          <Button type="button" variant="danger" block onClick={() => setConfirmar(true)}>
            <Trash2 size={18} /> Excluir
          </Button>
        </form>
      </Sheet>
      <ConfirmSheet
        open={confirmar}
        onClose={() => setConfirmar(false)}
        loading={salvando}
        title="Excluir categoria?"
        onConfirm={async () => {
          if (editando && (await executar(() => tiposRecursoApi.remove(editando.id), 'Categoria excluída'))) setEditando(null);
          setConfirmar(false);
        }}
      />
    </section>
  );
}
