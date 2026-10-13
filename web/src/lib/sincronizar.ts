/**
 * Mantém um valor do servidor (ex.: curtiu/salvou) em dia com o desejo do usuário mandando **um pedido por vez**:
 * toques rápidos só atualizam o desejo, e o pedido em curso, ao voltar, manda o próximo se ainda faltar.
 * Assim a ordem de chegada no servidor nunca inverte a última escolha.
 */
export function criarSincronizador<T, R>(inicial: T, enviar: (alvo: T) => Promise<R>, valorDe: (r: R) => T) {
  let servidor = inicial;
  let desejado = inicial;
  let ocupado = false;
  return {
    /** Valor confirmado pelo servidor. */
    get servidor() {
      return servidor;
    },
    /**
     * Registra o desejo. Quem iniciou o envio recebe a última resposta quando o servidor alcançar o desejo;
     * chamadas durante um envio devolvem `undefined` (o envio em curso cuida delas).
     */
    async querer(alvo: T): Promise<R | undefined> {
      desejado = alvo;
      if (ocupado) return undefined;
      ocupado = true;
      try {
        let ultima: R | undefined;
        while (servidor !== desejado) {
          ultima = await enviar(desejado);
          servidor = valorDe(ultima);
        }
        return ultima;
      } catch (error) {
        desejado = servidor;
        throw error;
      } finally {
        ocupado = false;
      }
    },
  };
}
