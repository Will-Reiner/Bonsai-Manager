import { useEffect, useRef } from 'react';
import type { ItemFoto } from '@/lib/loteFotos';

/** Pré-visualização de um arquivo local. A URL blob vive enquanto o componente estiver montado. */
export function FilePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={ref} alt={alt} className={className} />;
}

export function Miniaturas({ fotos, onClick }: { fotos: { item: ItemFoto; i: number }[]; onClick: (i: number) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {fotos.map(({ item, i }) => (
        <button key={item.key} onClick={() => onClick(i)} className="relative shrink-0">
          <FilePreview file={item.file} alt="" className="size-16 rounded-lg object-cover" />
          {item.upload === 'erro' && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-danger ring-2 ring-white" />}
        </button>
      ))}
    </div>
  );
}
