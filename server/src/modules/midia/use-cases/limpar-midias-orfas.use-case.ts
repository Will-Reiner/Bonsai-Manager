import { LimpezaDeMidia, MidiaReferenciaRepository, MidiaStorage } from '../midia.types';

/**
 * Apaga do storage as mídias que nenhum registro usa mais. Deve ser chamado DEPOIS da alteração no banco,
 * para que a consulta de referências já reflita o estado novo. Falhas só são logadas: um arquivo órfão
 * no bucket não pode derrubar a exclusão/edição que o usuário pediu.
 */
export class LimparMidiasOrfasUseCase implements LimpezaDeMidia {
  constructor(
    private referencias: MidiaReferenciaRepository,
    private storage: MidiaStorage,
  ) {}

  async execute(urls: (string | null | undefined)[]): Promise<void> {
    const candidatas = [...new Set(urls.filter((u): u is string => !!u))];
    if (!candidatas.length) return;

    try {
      const emUso = new Set(await this.referencias.urlsEmUso(candidatas));
      const orfas = candidatas.filter((u) => !emUso.has(u));
      if (orfas.length) await this.storage.removerPorUrls(orfas);
    } catch (error) {
      console.error('Erro ao remover mídias do storage:', error);
    }
  }
}
