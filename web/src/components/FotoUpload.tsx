import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { fotosApi } from '@/lib/endpoints';
import { keys } from '@/lib/queries';
import { dataCapturaDe, uploadImage } from '@/lib/upload';

export interface Envio {
  nome: string;
  pct: number;
}

/**
 * Envio de fotos de uma planta. Devolve os `<input>` escondidos (renderizar em algum lugar da tela),
 * `escolher()` para abrir a galeria e `tirarFoto()` para abrir direto a câmera do celular.
 */
export function useEnviarFotos(plantaId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [envios, setEnvios] = useState<Envio[]>([]);

  /** `daCamera`: foto tirada agora — a data do arquivo é a da captura, sem aviso de "sem data". */
  async function enviar(files: FileList, daCamera = false) {
    const lista = [...files].filter((f) => f.type.startsWith('image/'));
    setEnvios(lista.map((f) => ({ nome: f.name, pct: 0 })));
    let ok = 0;
    let semData = 0;
    for (const [i, file] of lista.entries()) {
      try {
        const [url, { data: dataCaptura, origem }] = await Promise.all([
          uploadImage(file, (pct) => setEnvios((e) => e.map((x, j) => (j === i ? { ...x, pct } : x)))),
          dataCapturaDe(file),
        ]);
        await fotosApi.create({ caminhoArquivo: url, plantaId, dataCaptura });
        ok++;
        if (origem === 'arquivo' && !daCamera) semData++;
      } catch (error) {
        toast(`${file.name}: ${errorMessage(error)}`, 'error');
      }
    }
    setEnvios([]);
    queryClient.invalidateQueries({ queryKey: keys.fotos(plantaId) });
    // A primeira foto pode virar a capa
    queryClient.invalidateQueries({ queryKey: keys.plantas });
    if (ok) toast(ok === 1 ? 'Foto adicionada' : `${ok} fotos adicionadas`);
    if (semData)
      toast(
        semData === 1
          ? 'A foto veio sem data de captura — usamos a data do arquivo.'
          : `${semData} fotos vieram sem data de captura — usamos a data do arquivo.`,
        'error',
      );
  }

  const input = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) enviar(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) enviar(e.target.files, true);
          e.target.value = '';
        }}
      />
    </>
  );

  return {
    input,
    envios,
    enviando: envios.length > 0,
    escolher: () => inputRef.current?.click(),
    tirarFoto: () => cameraRef.current?.click(),
  };
}

export function EnviosProgresso({ envios }: { envios: Envio[] }) {
  if (envios.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {envios.map((e, i) => (
        <div key={i} className="card p-3">
          <div className="flex justify-between text-xs">
            <span className="truncate">{e.nome}</span>
            <span className="text-muted">{e.pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-primary transition-all" style={{ width: `${e.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
