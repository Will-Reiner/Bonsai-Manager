import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '@/components/Sheet';
import { Button, Field } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { PlantaAtividadeFields } from './PlantaAtividadeFields';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { agendasApi, fotosApi } from '@/lib/endpoints';
import { fromDateInput, toDateInput } from '@/lib/format';
import { keys, useAtividades } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';

/** "Reguei agora, registra" — cria o cuidado já concluído, com nota e foto opcionais. */
export function RegisterCareSheet({
  open,
  onClose,
  plantaId: plantaInicial,
}: {
  open: boolean;
  onClose: () => void;
  plantaId?: string;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const atividades = useAtividades();
  const [plantaId, setPlantaId] = useState(plantaInicial ?? '');
  const [atividadeId, setAtividadeId] = useState('');
  const [data, setData] = useState(toDateInput());
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const hoje = data === toDateInput();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!plantaId || !atividadeId) return toast('Escolha a planta e o tipo de cuidado.', 'error');
    setSalvando(true);
    try {
      const quando = hoje ? new Date().toISOString() : fromDateInput(data);
      await agendasApi.registrarFeito({ plantaId, atividadeId, data: quando, detalhes: nota.trim() || undefined });
      if (foto) {
        const url = await uploadImage(foto, setProgresso);
        const atividade = atividades.data?.find((a) => a.id === atividadeId);
        await fotosApi.create({ caminhoArquivo: url, plantaId, titulo: atividade?.nome, dataCaptura: quando });
        queryClient.invalidateQueries({ queryKey: keys.fotos(plantaId) });
      }
      queryClient.invalidateQueries({ queryKey: keys.agendas });
      toast('Cuidado registrado 🌿');
      onClose();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
      setProgresso(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Registrar cuidado">
      <form id="register-care" onSubmit={submit} className="space-y-5 pb-2">
        <PlantaAtividadeFields
          plantaId={plantaId}
          onPlanta={setPlantaId}
          atividadeId={atividadeId}
          onAtividade={setAtividadeId}
          lockPlanta={!!plantaInicial}
        />
        <Field label="Quando">
          <input type="date" className="input" value={data} max={toDateInput()} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label="Nota (opcional)">
          <textarea
            className="input min-h-20"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ex.: substrato estava seco na superfície"
          />
        </Field>
        <PhotoInput file={foto} onChange={setFoto} label="Foto (opcional)" aspect="aspect-[16/9]" />
        <Button type="submit" block loading={salvando}>
          {progresso !== null ? `Enviando foto… ${progresso}%` : hoje ? 'Feito hoje' : 'Registrar'}
        </Button>
      </form>
    </Sheet>
  );
}
