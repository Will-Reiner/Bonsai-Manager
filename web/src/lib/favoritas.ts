/** Preferência `atividades_rastreadas`: ids das atividades favoritas, salvos como JSON. */
export const CHAVE_FAVORITAS = 'atividades_rastreadas';

/** Ids das atividades favoritas; valor ausente ou quebrado → nenhuma. */
export function lerFavoritas(texto: string | undefined): string[] {
  try {
    const valor: unknown = JSON.parse(texto || '[]');
    return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
