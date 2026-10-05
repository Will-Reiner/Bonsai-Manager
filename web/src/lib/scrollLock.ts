let travas = 0;

/**
 * Trava o scroll da página enquanto houver sheet/overlay aberto. Contador em vez de "salvar e restaurar
 * o valor anterior": com várias travas abertas, a ordem em que elas saem não importa — o scroll só volta
 * quando a última sair (antes, a página podia ficar presa em `overflow: hidden`).
 * Devolve a função que libera esta trava (chamá-la mais de uma vez não tem efeito).
 */
export function travarScroll(): () => void {
  if (travas++ === 0) document.body.style.overflow = 'hidden';
  let liberada = false;
  return () => {
    if (liberada) return;
    liberada = true;
    if (--travas === 0) document.body.style.overflow = '';
  };
}
