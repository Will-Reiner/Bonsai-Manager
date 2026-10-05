import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, ErrorState, Field, PageHeader, Spinner } from '@/components/ui';
import { ConfirmSheet, Sheet } from '@/components/Sheet';
import { PhotoInput } from '@/components/PhotoInput';
import { SpeciesPicker } from '@/components/SpeciesPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { plantasApi } from '@/lib/endpoints';
import { especieNome, fromDateInput, toDateInput } from '@/lib/format';
import { keys, useEspecies, usePlanta } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';
import { MODOS_AQUISICAO, type ModoAquisicao, type Planta } from '@/types';

export function EditPlantPage() {
  const { id = '' } = useParams();
  const planta = usePlanta(id);

  if (planta.isLoading) return <><PageHeader title="Editar planta" back /><Spinner /></>;
  if (planta.isError || !planta.data)
    return <><PageHeader title="Editar planta" back /><ErrorState text={errorMessage(planta.error, 'Planta não encontrada.')} /></>;
  return <EditPlantForm planta={planta.data} />;
}

function EditPlantForm({ planta: p }: { planta: Planta }) {
  const id = p.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const especies = useEspecies();

  const [especieId, setEspecieId] = useState(p.especieId ?? '');
  const [nome, setNome] = useState(p.nome ?? '');
  const [identificador, setIdentificador] = useState(p.identificador ?? '');
  const [dataAquisicao, setDataAquisicao] = useState(p.dataAquisicao ? toDateInput(p.dataAquisicao) : '');
  const [modo, setModo] = useState<ModoAquisicao | ''>(p.modoAquisicao ?? '');
  const [observacoes, setObservacoes] = useState(p.observacoes ?? '');
  const [foto, setFoto] = useState<File | null>(null);
  const [trocarEspecie, setTrocarEspecie] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const fotoCapaUrl = foto ? await uploadImage(foto) : undefined;
      await plantasApi.update(id, {
        especieId: especieId || undefined,
        nome: nome.trim(),
        identificador: identificador.trim() || null,
        dataAquisicao: dataAquisicao ? fromDateInput(dataAquisicao) : null,
        modoAquisicao: modo || null,
        observacoes: observacoes.trim(),
        ...(fotoCapaUrl ? { fotoCapaUrl } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Planta atualizada');
      navigate(`/plantas/${id}`, { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await plantasApi.remove(id);
      queryClient.removeQueries({ queryKey: keys.planta(id) });
      await queryClient.invalidateQueries({ queryKey: keys.plantas });
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast('Planta excluída');
      navigate('/colecao', { replace: true });
    } catch (error) {
      toast(errorMessage(error), 'error');
      setExcluindo(false);
    }
  }

  const especie = especies.data?.find((e) => e.id === especieId) ?? p.especie;

  return (
    <div>
      <PageHeader title="Editar planta" back />
      <form onSubmit={salvar} className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        <PhotoInput file={foto} onChange={setFoto} currentUrl={p.fotoCapaUrl} label="Foto de capa" />

        <div>
          <span className="label">Espécie</span>
          <button type="button" onClick={() => setTrocarEspecie(true)} className="input flex items-center justify-between text-left">
            <span>{especieId ? especieNome(especie) : 'Escolher espécie'}</span>
            <span className="text-sm font-medium text-primary">Trocar</span>
          </button>
        </div>

        <Field label="Apelido">
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label="Código / etiqueta">
          <input className="input" value={identificador} onChange={(e) => setIdentificador(e.target.value)} />
        </Field>
        <Field label="Data de aquisição">
          <input type="date" className="input" value={dataAquisicao} max={toDateInput()} onChange={(e) => setDataAquisicao(e.target.value)} />
        </Field>
        <div>
          <span className="label">Modo de aquisição</span>
          <div className="flex flex-wrap gap-2">
            {MODOS_AQUISICAO.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`chip ${modo === m.value ? 'chip-active' : ''}`}
                onClick={() => setModo(modo === m.value ? '' : m.value)}
                aria-pressed={modo === m.value}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Observações">
          <textarea className="input min-h-28" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </Field>

        <Button type="submit" block loading={salvando}>
          Salvar alterações
        </Button>
        <Button type="button" variant="danger" block onClick={() => setConfirmarExclusao(true)}>
          <Trash2 size={18} /> Excluir planta
        </Button>
      </form>

      <Sheet open={trocarEspecie} onClose={() => setTrocarEspecie(false)} title="Trocar espécie">
        <SpeciesPicker
          value={especieId}
          onChange={(novo) => {
            setEspecieId(novo);
            setTrocarEspecie(false);
          }}
        />
      </Sheet>
      <ConfirmSheet
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={excluir}
        loading={excluindo}
        title="Excluir planta?"
        text="Todas as tarefas, histórico e fotos desta planta serão apagados. Não dá para desfazer."
      />
    </div>
  );
}
