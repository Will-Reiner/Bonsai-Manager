import { useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { Button, PlantThumb } from '@/components/ui';
import { plantaCodigoNome } from '@/lib/format';
import type { Planta } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  plantas: Planta[];
  onSalvar: (plantaIds: string[]) => Promise<void>;
}

/** Gaveta com as plantas do usuário para marcar quais aparecem na Comunidade. */
export function SelecionarPlantasSheet({ open, ...props }: Props) {
  // Montada só aberta: cada abertura parte das plantas que já são públicas
  return open ? <GavetaAberta {...props} /> : null;
}

function GavetaAberta({ onClose, plantas, onSalvar }: Omit<Props, 'open'>) {
  const [marcadas, setMarcadas] = useState(() => new Set(plantas.filter((p) => p.plantaPublica).map((p) => p.id)));
  const [salvando, setSalvando] = useState(false);

  function alternar(id: string) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar([...marcadas]);
      onClose();
    } catch {
      // o erro já virou toast em quem salvou; a gaveta fica aberta para tentar de novo
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Plantas na comunidade"
      footer={
        <Button block loading={salvando} onClick={salvar}>
          Salvar · {marcadas.size} de {plantas.length}
        </Button>
      }
    >
      <ul className="divide-y divide-line">
        {plantas.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 py-2.5">
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-primary"
                checked={marcadas.has(p.id)}
                onChange={() => alternar(p.id)}
              />
              <PlantThumb url={p.fotoCapaUrl} id={p.id} className="size-11 rounded-lg" />
              <span className="min-w-0 flex-1 truncate font-medium">{plantaCodigoNome(p)}</span>
            </label>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
