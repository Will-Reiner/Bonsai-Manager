import { useState } from 'react';

/** Lê uma escolha salva; armazenamento indisponível ou valor estranho → padrão. */
export function lerEscolha<T extends string>(chave: string, validos: { value: T }[], padrao: T): T {
  try {
    const v = localStorage.getItem(chave);
    return validos.some((o) => o.value === v) ? (v as T) : padrao;
  } catch {
    return padrao;
  }
}

export function salvarEscolha(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: a escolha vale só nesta visita
  }
}

/** Estado lembrado entre visitas (localStorage). Sem `validos`, aceita qualquer texto salvo. */
export function useEscolha<T extends string>(chave: string, padrao: T, validos?: { value: T }[]) {
  const [valor, setValor] = useState<T>(() => {
    if (validos) return lerEscolha(chave, validos, padrao);
    try {
      return (localStorage.getItem(chave) as T | null) ?? padrao;
    } catch {
      return padrao;
    }
  });
  const trocar = (v: T) => {
    setValor(v);
    salvarEscolha(chave, v);
  };
  return [valor, trocar] as const;
}
